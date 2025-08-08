import { AbstractChat, ChatInit, ChatState, ChatStatus, UIMessage } from 'ai';
import { Signal } from '@builder.io/qwik';
import { throttle } from './throttle';

class QwikChatState<UI_MESSAGE extends UIMessage>
  implements ChatState<UI_MESSAGE>
{
  #messagesSignal: Signal<UI_MESSAGE[]>;
  #statusSignal: Signal<ChatStatus>;
  #errorSignal: Signal<Error | undefined>;

  #messagesCallbacks = new Set<() => void>();
  #statusCallbacks = new Set<() => void>();
  #errorCallbacks = new Set<() => void>();

  constructor(initialMessages: UI_MESSAGE[] = []) {
    // Create simple signal-like objects for state management
    this.#messagesSignal = { value: initialMessages } as Signal<UI_MESSAGE[]>;
    this.#statusSignal = { value: 'ready' as ChatStatus } as Signal<ChatStatus>;
    this.#errorSignal = { value: undefined } as Signal<Error | undefined>;
  }

  get status(): ChatStatus {
    return this.#statusSignal.value;
  }

  set status(newStatus: ChatStatus) {
    this.#statusSignal.value = newStatus;
    this.#callStatusCallbacks();
  }

  get error(): Error | undefined {
    return this.#errorSignal.value;
  }

  set error(newError: Error | undefined) {
    this.#errorSignal.value = newError;
    this.#callErrorCallbacks();
  }

  get messages(): UI_MESSAGE[] {
    return this.#messagesSignal.value;
  }

  set messages(newMessages: UI_MESSAGE[]) {
    this.#messagesSignal.value = [...newMessages];
    this.#callMessagesCallbacks();
  }

  pushMessage = (message: UI_MESSAGE) => {
    this.#messagesSignal.value = [...this.#messagesSignal.value, message];
    this.#callMessagesCallbacks();
  };

  popMessage = () => {
    this.#messagesSignal.value = this.#messagesSignal.value.slice(0, -1);
    this.#callMessagesCallbacks();
  };

  replaceMessage = (index: number, message: UI_MESSAGE) => {
    const newMessages = [
      ...this.#messagesSignal.value.slice(0, index),
      // Deep clone the message to ensure proper reactivity
      this.snapshot(message),
      ...this.#messagesSignal.value.slice(index + 1),
    ];
    this.#messagesSignal.value = newMessages;
    this.#callMessagesCallbacks();
  };

  snapshot = <T>(value: T): T => structuredClone(value);

  '~registerMessagesCallback' = (
    onChange: () => void,
    throttleWaitMs?: number,
  ): (() => void) => {
    const callback = throttleWaitMs
      ? throttle(onChange, throttleWaitMs)
      : onChange;
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
    this.#messagesCallbacks.forEach(callback => callback());
  };

  #callStatusCallbacks = () => {
    this.#statusCallbacks.forEach(callback => callback());
  };

  #callErrorCallbacks = () => {
    this.#errorCallbacks.forEach(callback => callback());
  };
}

export class Chat<
  UI_MESSAGE extends UIMessage,
> extends AbstractChat<UI_MESSAGE> {
  #state: QwikChatState<UI_MESSAGE>;

  constructor({ messages, ...init }: ChatInit<UI_MESSAGE>) {
    const state = new QwikChatState(messages);
    super({ ...init, state });
    this.#state = state;
  }

  static create<UI_MESSAGE extends UIMessage>(init: ChatInit<UI_MESSAGE>): Chat<UI_MESSAGE> {
    return new Chat(init);
  }

  // Expose the callbacks for Qwik reactivity
  '~registerMessagesCallback' = (
    onChange: () => void,
    throttleWaitMs?: number,
  ): (() => void) =>
    this.#state['~registerMessagesCallback'](onChange, throttleWaitMs);

  '~registerStatusCallback' = (onChange: () => void): (() => void) =>
    this.#state['~registerStatusCallback'](onChange);

  '~registerErrorCallback' = (onChange: () => void): (() => void) =>
    this.#state['~registerErrorCallback'](onChange);
}