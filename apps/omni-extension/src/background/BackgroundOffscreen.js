/* eslint-disable class-methods-use-this */
import { IS_FIREFOX } from '@/common/utils/constant';
import { sleep } from '@/utils/helper';
import { MessageListener } from '@/utils/message';
import Browser from 'webextension-polyfill';

const OFFSCREEN_URL = Browser.runtime.getURL('/offscreen.html');

class BackgroundOffscreen {
  /** @type {BackgroundOffscreen} */
  static #_instance;

  /**
   * OffscreenService singleton
   * @returns {BackgroundOffscreen}
   */
  static get instance() {
    if (!this.#_instance) {
      this.#_instance = new BackgroundOffscreen();
    }

    return this.#_instance;
  }

  /** @type {MessageListener} */
  #messageListener;

  #creatingPromise;

  constructor() {
    this.#messageListener = new MessageListener('offscreen');

    this.on = this.#messageListener.on;
  }

  /**
   *
   * @returns {Promise<boolean>}
   */
  async #ensureDocument() {
    if (IS_FIREFOX) return;

    if (this.#creatingPromise) {
      await this.#creatingPromise;
      return;
    }

    const isOpened = await this.isOpened();
    if (isOpened) return;

    this.#creatingPromise = (async () => {
      try {
        await chrome.offscreen.createDocument({
          url: OFFSCREEN_URL,
          reasons: [
            chrome.offscreen.Reason.BLOBS,
            chrome.offscreen.Reason.CLIPBOARD,
            chrome.offscreen.Reason.IFRAME_SCRIPTING,
          ],
          justification: 'For running the workflow',
        });
        await sleep(500);
      } catch (error) {
        if (!error.message.includes('Only a single offscreen document may be created')) {
          throw error;
        }
      } finally {
        this.#creatingPromise = null;
      }
    })();

    await this.#creatingPromise;
  }

  /**
   *
   * @returns {Promise<boolean>}
   */
  async isOpened() {
    if (IS_FIREFOX) return false;

    const contexts = await chrome.runtime.getContexts({
      documentUrls: [OFFSCREEN_URL],
      contextTypes: ['OFFSCREEN_DOCUMENT'],
    });

    return Boolean(contexts.length);
  }

  /**
   *
   * @param {string} name
   * @param {*} data
   * @returns {Promise<*>}
   */
  async sendMessage(name, data) {
    await this.#ensureDocument();

    return this.#messageListener.sendMessage(name, data);
  }
}

export default BackgroundOffscreen;
