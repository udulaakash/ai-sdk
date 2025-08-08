import { AbstractChat, type ChatInit, type ChatStatus, type CreateUIMessage, type UIMessage } from 'ai';
import { throttle } from './throttle';

export type { CreateUIMessage, UIMessage };

class QwikChatState<UI_MESSAGE extends UIMessage> {
  #messages: UI_MESSAGE[];
  #status: ChatStatus = 'ready';
  #error: Error | undefined = undefined;

  #messagesCallbacks = new Set<() => void>();
  #statusCallbacks = new Set<() => void>();
  #errorCallbacks = new Set<() => void>();

  constructor(initialMessages: UI_MESSAGE[] = []) {
    this.#messages = initialMessages;
  }

  get status(): ChatStatus {
    return this.#status;
  }

  set status(newStatus: ChatStatus) {
    this.#status = newStatus;
    this.#callStatusCallbacks();
  }

  get error(): Error | undefined {
    return this.#error;
  }

  set error(newError: Error | undefined) {
    this.#error = newError;
    this.#callErrorCallbacks();
  }

  get messages(): UI_MESSAGE[] {
    return this.#messages;
  }

  set messages(newMessages: UI_MESSAGE[]) {
    this.#messages = [...newMessages];
    this.#callMessagesCallbacks();
  }

  pushMessage = (message: UI_MESSAGE) => {
    this.#messages = this.#messages.concat(message);
    this.#callMessagesCallbacks();
  };

  popMessage = () => {
    this.#messages = this.#messages.slice(0, -1);
    this.#callMessagesCallbacks();
  };

  replaceMessage = (index: number, message: UI_MESSAGE) => {
    this.#messages = [
      ...this.#messages.slice(0, index),
      // deep clone to ensure change detection consumers see updates on nested data
      this.snapshot(message),
      ...this.#messages.slice(index + 1),
    ];
    this.#callMessagesCallbacks();
  };

  snapshot = <T>(value: T): T => structuredClone(value);

  '~registerMessagesCallback' = (
    onChange: () => void,
    throttleWaitMs?: number,
  ): (() => void) => {
    const callback = throttleWaitMs ? throttle(onChange, throttleWaitMs) : onChange;
    this.#messagesCallbacks.add(callback);
    return () => {
      this.#messagesCallbacks.delete(callback);
    };
  };

  '~registerStatusCallback' = (onChange: () => void): (() => void) => {
    this.#statusCallbacks.add(onChange);
    return () => {
      this.#statusCallbacks.delete(onChange);
    };
  };

  '~registerErrorCallback' = (onChange: () => void): (() => void) => {
    this.#errorCallbacks.add(onChange);
    return () => {
      this.#errorCallbacks.delete(onChange);
    };
  };

  #callMessagesCallbacks = () => {
    this.#messagesCallbacks.forEach(cb => cb());
  };

  #callStatusCallbacks = () => {
    this.#statusCallbacks.forEach(cb => cb());
  };

  #callErrorCallbacks = () => {
    this.#errorCallbacks.forEach(cb => cb());
  };
}

export class Chat<UI_MESSAGE extends UIMessage = UIMessage> extends AbstractChat<UI_MESSAGE> {
  #state: QwikChatState<UI_MESSAGE>;

  constructor({ messages, ...init }: ChatInit<UI_MESSAGE>) {
    const state = new QwikChatState<UI_MESSAGE>(messages);
    super({ ...init, state } as ChatInit<UI_MESSAGE> & { state: QwikChatState<UI_MESSAGE> });
    this.#state = state;
  }

  '~registerMessagesCallback' = (
    onChange: () => void,
    throttleWaitMs?: number,
  ): (() => void) => this.#state['~registerMessagesCallback'](onChange, throttleWaitMs);

  '~registerStatusCallback' = (onChange: () => void): (() => void) =>
    this.#state['~registerStatusCallback'](onChange);

  '~registerErrorCallback' = (onChange: () => void): (() => void) =>
    this.#state['~registerErrorCallback'](onChange);
}