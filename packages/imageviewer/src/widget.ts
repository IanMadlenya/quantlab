// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import {
  ABCWidgetFactory, DocumentRegistry
} from '@quantlab/docregistry';

import {
  PromiseDelegate
} from '@phosphor/coreutils';

import {
  Message
} from '@phosphor/messaging';

import {
  Widget
} from '@phosphor/widgets';


/**
 * The class name added to a imageviewer.
 */
const IMAGE_CLASS = 'jp-ImageViewer';


/**
 * A widget for images.
 */
export
class ImageViewer extends Widget implements DocumentRegistry.IReadyWidget {
  /**
   * Construct a new image widget.
   */
  constructor(context: DocumentRegistry.Context) {
    super({ node: Private.createNode() });
    this._context = context;
    this.node.tabIndex = -1;
    this.addClass(IMAGE_CLASS);

    this._onTitleChanged();
    context.pathChanged.connect(this._onTitleChanged, this);

    context.ready.then(() => {
      this._render();
      context.model.contentChanged.connect(this.update, this);
      context.fileChanged.connect(this.update, this);
      this._ready.resolve(void 0);
    });
  }

  /**
   * The image widget's context.
   */
  get context(): DocumentRegistry.Context {
    return this._context;
  }

  /**
   * A promise that resolves when the image viewer is ready.
   */
  get ready(): Promise<void> {
    return this._ready.promise;
  }

  /**
   * The scale factor for the image.
   */
  get scale(): number {
    return this._scale;
  }
  set scale(value: number) {
    if (value === this._scale) {
      return;
    }
    this._scale = value;
    let scaleNode = this.node.querySelector('div') as HTMLElement;
    let transform: string;
    transform = `scale(${value})`;
    scaleNode.style.transform = transform;
  }

  /**
   * Dispose of the resources used by the widget.
   */
  dispose(): void {
    this._context = null;
    super.dispose();
  }

  /**
   * Handle `update-request` messages for the widget.
   */
  protected onUpdateRequest(msg: Message): void {
    let context = this._context;
    if (this.isDisposed || !context.isReady) {
      return;
    }
    this._render();
  }

  /**
   * Handle `'activate-request'` messages.
   */
  protected onActivateRequest(msg: Message): void {
    this.node.focus();
  }

  /**
   * Handle a change to the title.
   */
  private _onTitleChanged(): void {
    this.title.label = this._context.path.split('/').pop();
  }

  /**
   * Render the widget content.
   */
  private _render(): void {
    let context = this._context;
    let cm = context.contentsModel;
    let content = context.model.toString();
    let src = `data:${cm.mimetype};${cm.format},${content}`;
    this.node.querySelector('img').setAttribute('src', src);
  }

  private _context: DocumentRegistry.Context;
  private _scale = 1;
  private _ready = new PromiseDelegate<void>();
}


/**
 * A widget factory for images.
 */
export
class ImageViewerFactory extends ABCWidgetFactory<ImageViewer, DocumentRegistry.IModel> {
  /**
   * Create a new widget given a context.
   */
  protected createNewWidget(context: DocumentRegistry.IContext<DocumentRegistry.IModel>): ImageViewer {
    return new ImageViewer(context);
  }
}

/**
 * A namespace for image widget private data.
 */
namespace Private {
  /**
   * Create the node for the image widget.
   */
  export
  function createNode(): HTMLElement {
    let node = document.createElement('div');
    let innerNode = document.createElement('div');
    let image = document.createElement('img');
    node.appendChild(innerNode);
    innerNode.appendChild(image);
    return node;
  }
}
