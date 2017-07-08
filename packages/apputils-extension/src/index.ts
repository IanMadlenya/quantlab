/*-----------------------------------------------------------------------------
| Copyright (c) Jupyter Development Team.
| Distributed under the terms of the Modified BSD License.
|----------------------------------------------------------------------------*/

import {
  ILayoutRestorer, QuantLab, QuantLabPlugin
} from '@quantlab/application';

import {
  ICommandPalette, IMainMenu, MainMenu
} from '@quantlab/apputils';

import {
  ISettingRegistry, IStateDB, SettingRegistry, StateDB
} from '@quantlab/coreutils';

import {
  JSONObject
} from '@phosphor/coreutils';

import {
  Widget
} from '@phosphor/widgets';

import {
  activatePalette
} from './palette';

import {
  SettingClientDataConnector
} from './settingclientdataconnector';


/**
 * The command IDs used by the apputils plugin.
 */
namespace CommandIDs {
  export
  const clearStateDB = 'apputils:clear-statedb';
};


/**
 * A service providing an interface to the main menu.
 */
const mainMenuPlugin: QuantLabPlugin<IMainMenu> = {
  id: 'jupyter.services.main-menu',
  provides: IMainMenu,
  activate: (app: QuantLab): IMainMenu => {
    let menu = new MainMenu();
    menu.id = 'jp-MainMenu';

    let logo = new Widget();
    logo.node.className = 'jp-MainAreaPortraitIcon jp-JupyterIcon';
    logo.id = 'jp-MainLogo';

    app.shell.addToTopArea(logo);
    app.shell.addToTopArea(menu);

    return menu;
  }
};


/**
 * The default commmand palette extension.
 */
const palettePlugin: QuantLabPlugin<ICommandPalette> = {
  activate: activatePalette,
  id: 'jupyter.services.commandpalette',
  provides: ICommandPalette,
  requires: [ILayoutRestorer],
  autoStart: true
};


/**
 * The default setting registry provider.
 */
const settingPlugin: QuantLabPlugin<ISettingRegistry> = {
  id: 'jupyter.services.setting-registry',
  activate: () => new SettingRegistry({
    connector: new SettingClientDataConnector(),
    preload: SettingClientDataConnector.preload
  }),
  autoStart: true,
  provides: ISettingRegistry
};


/**
 * The default state database for storing application state.
 */
const stateDBPlugin: QuantLabPlugin<IStateDB> = {
  id: 'jupyter.services.statedb',
  autoStart: true,
  provides: IStateDB,
  activate: (app: QuantLab) => {
    const state = new StateDB({ namespace: app.info.namespace });
    const version = app.info.version;
    const key = 'statedb:version';
    const fetch = state.fetch(key);
    const save = () => state.save(key, { version });
    const reset = () => state.clear().then(save);
    const check = (value: JSONObject) => {
      let old = value && value['version'];
      if (!old || old !== version) {
        const previous = old || 'unknown';
        console.log(`Upgraded: ${previous} to ${version}; Resetting DB.`);
        return reset();
      }
    };

    app.commands.addCommand(CommandIDs.clearStateDB, {
      label: 'Clear Application Restore State',
      execute: () => state.clear()
    });

    return fetch.then(check, reset).then(() => state);
  }
};


/**
 * Export the plugins as default.
 */
const plugins: QuantLabPlugin<any>[] = [
  mainMenuPlugin,
  palettePlugin,
  settingPlugin,
  stateDBPlugin
];
export default plugins;
