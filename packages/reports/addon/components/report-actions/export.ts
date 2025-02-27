/**
 * Copyright 2021, Yahoo Holdings Inc.
 * Licensed under the terms of the MIT license. See accompanying LICENSE.md file for terms.
 */

import { inject as service } from '@ember/service';
import Component from '@glimmer/component';
import { TaskGenerator, task } from 'ember-concurrency';
import { taskFor } from 'ember-concurrency-ts';
import type NaviFactsService from 'navi-data/services/navi-facts';
import type NaviNotificationsService from 'navi-core/services/interfaces/navi-notifications';
import type ReportModel from 'navi-core/models/report';
import { RequestV2 } from 'navi-data/adapters/facts/interface';
import Ember from 'ember';
import { dasherize } from '@ember/string';
import moment from 'moment';

interface Args {
  model: ReportModel;
}

export default class ReportActionExport extends Component<Args> {
  /**
   * instance of navi facts service
   */
  @service('navi-facts') declare facts: NaviFactsService;

  /**
   * instance of navi notifications service
   */
  @service declare naviNotifications: NaviNotificationsService;

  /**
   * export format
   */
  exportType = 'CSV';

  get modelType() {
    //@ts-ignore
    return this.args.model.constructor.modelName;
  }

  /**
   * filename along with the format for the downloaded file
   */
  get filename() {
    const dateString = moment().format('YYYYMMDDTHHmmss');
    return `${this.args.model.title}-${dateString}`;
  }

  /**
   * Determines whether the report is valid for exporting
   */
  async isValidForExport(): Promise<boolean> {
    const { model } = this.args;
    await model.request?.loadMetadata();
    return model.validations.isTruelyValid;
  }

  @task *downloadTask(): TaskGenerator<void> {
    const serializedRequest = this.args.model.request.serialize() as RequestV2;

    try {
      let url: string = yield taskFor(this.facts.getDownloadURL).perform(serializedRequest, {
        format: 'csv',
        dataSourceName: serializedRequest.dataSource,
        fileName: `${this.filename}.csv`,
      });
      this.downloadURLLink(url);
    } catch (e) {
      this.showErrorNotification(e?.message);
    }
  }

  /**
   * Gets the table export url from facts service
   */
  @task *exportTask(): TaskGenerator<void> {
    this.showExportNotification();

    const isValid: boolean = yield this.isValidForExport();

    if (!isValid) {
      this.showErrorNotification(`Please validate the ${this.modelType} and try again.`);
    } else {
      yield taskFor(this.downloadTask).perform();
    }
  }

  showExportNotification(): void {
    const { naviNotifications, exportType } = this;

    naviNotifications.clear();
    naviNotifications.add({
      title: `Your ${exportType} download should begin shortly`,
      style: 'info',
    });
  }

  showErrorNotification(message?: string): void {
    const { naviNotifications } = this;

    naviNotifications.clear();
    naviNotifications.add({
      title: message ?? `An error occurred while exporting.`,
      style: 'danger',
    });
  }

  async downloadURLLink(url?: string | undefined) {
    if (url !== undefined) {
      const anchorElement = document.createElement('a');
      anchorElement.setAttribute('class', 'export__download-link');
      anchorElement.setAttribute('href', url);
      anchorElement.setAttribute('download', dasherize(this.filename));
      anchorElement.setAttribute('target', '_blank');
      document.querySelector('#export__download-url')?.appendChild(anchorElement);
      if (Ember.testing) {
        await this.delay(5000);
      } else {
        anchorElement.click();
      }
      anchorElement.remove();
    }
  }

  delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
