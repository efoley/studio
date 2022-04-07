// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

declare module "@foxglove/studio" {
  // Valid types for parameter data (such as rosparams)
  export type ParameterValue =
    | undefined
    | boolean
    | number
    | string
    | Date
    | Uint8Array
    | ParameterValue[]
    | ParameterStruct;

  export type ParameterStruct = Record<string, ParameterValue>;

  // Valid types for application settings
  export type AppSettingValue = string | number | boolean | undefined;

  export interface Time {
    sec: number;
    nsec: number;
  }

  // A topic is a namespace for specific types of messages
  export type Topic = {
    // topic name i.e. "/some/topic"
    name: string;
    // topic datatype
    datatype: string;
  };

  export type SettingsTreeFieldValue =
    | { input: "autocomplete"; value?: string; items: string[] }
    | { input: "boolean"; value?: boolean }
    | { input: "color"; value?: string }
    | { input: "gradient"; value?: string }
    | { input: "number"; value?: number }
    | { input: "select"; value?: string; options: string[] }
    | { input: "string"; value?: string }
    | { input: "toggle"; value?: string; options: string[] };

  export type SettingsTreeField = SettingsTreeFieldValue & {
    label: string;
    help?: string;
    placeholder?: string;
  };

  export type SettingsTreeFields = Record<string, SettingsTreeField>;
  export type SettingsTreeChildren = Record<string, SettingsTreeNode>;

  export type SettingsTreeNode = {
    label?: string;
    fields?: SettingsTreeFields;
    children?: SettingsTreeChildren;
  };

  export type SettingsTreeAction = {
    action: "update";
    payload: { path: string[]; value: unknown };
  };

  /**
   * A settings tree is a tree of panel settings that can be managed by
   * a default user interface in Studio.
   */
  export type SettingsTree = {
    actionHandler: (action: SettingsTreeAction) => void;
    settings: SettingsTreeNode;
  };

  /**
   * A message event frames message data with the topic and receive time
   */
  export type MessageEvent<T> = Readonly<{
    /** The topic name this message was received on, i.e. "/some/topic" */
    topic: string;
    /**
     * The time in nanoseconds this message was received. This may be set by the
     * local system clock or the data source, depending on the data source used
     * and whether time is simulated via a /clock topic or similar mechanism.
     * The timestamp is often nanoseconds since the UNIX epoch, but may be
     * relative to another event such as system boot time or simulation start
     * time depending on the context.
     */
    receiveTime: Time;
    /**
     * The time in nanoseconds this message was originally published. This is
     * only available for some data sources. The timestamp is often nanoseconds
     * since the UNIX epoch, but may be relative to another event such as system
     * boot time or simulation start time depending on the context.
     */
    publishTime?: Time;
    /** The deserialized message as a JavaScript object. */
    message: T;
    /**
     * The approximate size of this message in its serialized form. This can be
     * useful for statistics tracking and cache eviction.
     */
    sizeInBytes: number;
  }>;

  export interface LayoutActions {
    /** Open a new panel or update an existing panel in the layout.  */
    addPanel(params: {
      /**
       * Where to position the panel. Currently, only "sibling" is supported which indicates the
       * new panel will be adjacent to the calling panel.
       */
      position: "sibling";

      /**
       * The type of panel to open. For internal panels, this corresponds to the `static panelType`.
       * For extension panels, this `"extensionName.panelName"` where extensionName is the `name`
       * field from the extension's package.json, and panelName is the name provided to
       * `registerPanel()`.
       */
      type: string;

      /**
       * Whether to update an existing sibling panel of the same type, if it already exists. If
       * false, a new panel will always be added.
       */
      updateIfExists: boolean;

      /**
       * A function that returns the state for the new panel. If updating an existing panel, the
       * existing state will be passed in.
       * @see `updateIfExists`
       */
      getState(existingState?: unknown): unknown;
    }): void;
  }

  export interface RenderState {
    /**
     * The panel configuration.
     */
    configuration?: Record<string, unknown>;

    /**
     * The latest messages for the current render frame. These are new messages since the last render frame.
     */
    currentFrame?: readonly MessageEvent<unknown>[];

    /**
     * All available messages. Best-effort list of all available messages.
     */
    allFrames?: readonly MessageEvent<unknown>[];

    /**
     * Map of current parameter values.
     */
    parameters?: ReadonlyMap<string, ParameterValue>;

    /**
     * List of available topics. This list includes subscribed and unsubscribed topics.
     */
    topics?: readonly Topic[];

    /**
     * A timestamp value indicating the current playback time.
     */
    currentTime?: Time;

    /**
     * A seconds value indicating a preview time. The preview time is set when a user hovers
     * over the seek bar or when a panel sets the preview time explicitly. The preview time
     * is a seconds value within the playback range.
     *
     * i.e. A plot panel may set the preview time when a user is hovering over the plot to signal
     * to other panels where the user is currently hovering and allow them to render accordingly.
     */
    previewTime?: number | undefined;

    /** The color scheme currently in use throughout the app. */
    colorScheme?: "dark" | "light";

    /** Application settings. This will only contain subscribed application setting key/values */
    appSettings?: ReadonlyMap<string, AppSettingValue>;
  }

  export type PanelExtensionContext = {
    /**
     * The root element for the panel. Add your panel elements as children under this element.
     */
    readonly panelElement: HTMLDivElement;

    /**
     * Initial panel state
     */
    readonly initialState: unknown;

    /** Actions the panel may perform related to the user's current layout. */
    readonly layout: LayoutActions;

    /**
     * Publish a settings UI description.
     */
    publishPanelSettingsTree: (settings: SettingsTree) => void;

    /**
     * Subscribe to updates on this field within the render state. Render will only be invoked when
     * this field changes.
     */
    watch: (field: keyof RenderState) => void;

    /**
     * Save arbitrary object as persisted panel state. This state is persisted for the panel
     * within a layout.
     *
     * The state value should be JSON serializable.
     */
    saveState: (state: Partial<unknown>) => void;

    /**
     * Set the value of parameter name to value.
     *
     * @param name The name of the parameter to set.
     * @param value The new value of the parameter.
     */
    setParameter: (name: string, value: ParameterValue) => void;

    /**
     * Set the active preview time. Setting the preview time to undefined clears the preview time.
     */
    setPreviewTime: (time: number | undefined) => void;

    /**
     * Seek playback to the given time. Behaves as if the user had clicked the playback bar to seek.
     */
    seekPlayback?: (time: number) => void;

    /**
     * Subscribe to an array of topic names.
     *
     * Subscribe will update the current subscriptions to the list of topic names. Passing an empty
     * array will unsubscribe from all topics.
     */
    subscribe(topics: string[]): void;

    /**
     * Unsubscribe from all topics.
     */
    unsubscribeAll(): void;

    /**
     * Subscribe to any changes in application settings for an array of setting names.
     */
    subscribeAppSettings(settings: string[]): void;

    /**
     * Indicate intent to advertise on a specific topic and datatype.
     *
     * The options object is passed to the current data source for additional configuration.
     */
    advertise?(topic: string, datatype: string, options?: Record<string, unknown>): void;

    /**
     * Indicate that you no longer want to advertise on this topic.
     */
    unadvertise?(topic: string): void;

    /**
     * Publish a message on a given topic. You must first advertise on the topic before publishing.
     *
     * @param topic The name of the topic to publish the message on
     * @param message The message to publish
     */
    publish?(topic: string, message: unknown): void;

    /**
     * Process render events for the panel. Each render event receives a render state and a done callback.
     * Render events occur frequently (60hz, 30hz, etc).
     *
     * The done callback should be called once the panel has rendered the render state.
     */
    onRender?: (renderState: Readonly<RenderState>, done: () => void) => void;
  };

  export type ExtensionPanelRegistration = {
    // Unique name of the panel within your extension
    //
    // NOTE: Panel names within your extension must be unique. The panel name identifies this panel
    // within a layout. Changing the panel name will cause layouts using the old name unable to load
    // your panel.
    name: string;

    // This function is invoked when your panel is initialized
    initPanel: (context: PanelExtensionContext) => void;
  };

  export interface ExtensionContext {
    /** The current _mode_ of the application. */
    readonly mode: "production" | "development" | "test";

    registerPanel(params: ExtensionPanelRegistration): void;
  }

  export interface ExtensionActivate {
    (extensionContext: ExtensionContext): void;
  }

  // ExtensionModule describes the interface your extension entry level module must export
  // as its default export
  export interface ExtensionModule {
    activate: ExtensionActivate;
  }
}
