// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import {
  QuantLab, QuantLabPlugin, ILayoutRestorer, LayoutRestorer
} from '@quantlab/application';

import {
  Dialog, ICommandPalette, showDialog
} from '@quantlab/apputils';

import {
  IStateDB, PageConfig
} from '@quantlab/coreutils';

import {
  h
} from '@phosphor/virtualdom';

/**
 * The command IDs used by the application plugin.
 */
namespace CommandIDs {
  export
  const activateNextTab: string = 'application:activate-next-tab';

  export
  const activatePreviousTab: string = 'application:activate-previous-tab';

  export
  const closeAll: string = 'application:close-all';

  export
  const setMode: string = 'application:set-mode';

  export
  const toggleMode: string = 'application:toggle-mode';
};


/**
 * The main extension.
 */
const mainPlugin: QuantLabPlugin<void> = {
  id: 'jupyter.extensions.main',
  requires: [ICommandPalette],
  activate: (app: QuantLab, palette: ICommandPalette) => {
    addCommands(app, palette);

    // Temporary build message for manual rebuild.
    let buildMessage = PageConfig.getOption('buildRequired');
    if (buildMessage) {
      let body = h.div(
        h.p(
          'QuantLab build is out of date',
          h.br(),
          'Please run',
          h.code(' jupyter quantlab build '),
          'from',
          h.br(),
          'the command line and relaunch'
        )
      );
      showDialog({
        title: 'Build Recommended',
        body,
        buttons: [Dialog.okButton()]
      });
    }

    const message = 'Are you sure you want to exit QuantLab?\n' +
                    'Any unsaved changes will be lost.';

    // The spec for the `beforeunload` event is implemented differently by
    // the different browser vendors. Consequently, the `event.returnValue`
    // attribute needs to set in addition to a return value being returned.
    // For more information, see:
    // https://developer.mozilla.org/en/docs/Web/Events/beforeunload
    window.addEventListener('beforeunload', event => {
      return (event as any).returnValue = message;
    });
  },
  autoStart: true
};


/**
 * The default layout restorer provider.
 */
const layoutPlugin: QuantLabPlugin<ILayoutRestorer> = {
  id: 'jupyter.services.layout-restorer',
  requires: [IStateDB],
  activate: (app: QuantLab, state: IStateDB) => {
    const first = app.started;
    const registry = app.commands;
    let restorer = new LayoutRestorer({ first, registry, state });
    restorer.fetch().then(saved => {
      app.shell.restoreLayout(saved);
      app.shell.layoutModified.connect(() => {
        restorer.save(app.shell.saveLayout());
      });
    });
    return restorer;
  },
  autoStart: true,
  provides: ILayoutRestorer
};


/**
 * Add the main application commands.
 */
function addCommands(app: QuantLab, palette: ICommandPalette): void {
  const category = 'Main Area';
  let command = CommandIDs.activateNextTab;
  app.commands.addCommand(command, {
    label: 'Activate Next Tab',
    execute: () => { app.shell.activateNextTab(); }
  });
  palette.addItem({ command, category });

  command = CommandIDs.activatePreviousTab;
  app.commands.addCommand(command, {
    label: 'Activate Previous Tab',
    execute: () => { app.shell.activatePreviousTab(); }
  });
  palette.addItem({ command, category });

  command = CommandIDs.closeAll;
  app.commands.addCommand(command, {
    label: 'Close All Widgets',
    execute: () => { app.shell.closeAll(); }
  });
  palette.addItem({ command, category });

  command = CommandIDs.setMode;
  app.commands.addCommand(command, {
    isVisible: args => {
      const mode = args['mode'] as string;
      return mode === 'single-document' || mode === 'multiple-document';
    },
    execute: args => {
      const mode = args['mode'] as string;
      if (mode === 'single-document' || mode === 'multiple-document') {
        app.shell.mode = mode;
        return;
      }
      throw new Error(`Unsupported application shell mode: ${mode}`);
    }
  });

  command = CommandIDs.toggleMode;
  app.commands.addCommand(command, {
    label: 'Toggle Single-Document Mode',
    execute: () => {
      const args = app.shell.mode === 'multiple-document' ?
        { mode: 'single-document' } : { mode: 'multiple-document' };
      return app.commands.execute(CommandIDs.setMode, args);
    }
  });
  palette.addItem({ command, category });
}


/**
 * Export the plugins as default.
 */
const plugins: QuantLabPlugin<any>[] = [
  mainPlugin,
  layoutPlugin
];
export default plugins;
