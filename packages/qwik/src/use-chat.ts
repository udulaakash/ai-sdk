import {
  AbstractChat,
  ChatInit,
  type CreateUIMessage,
  type UIMessage,
} from 'ai';
import { useSignal, useVisibleTask$, useStore, $ } from '@builder.io/qwik';
import { Chat } from './chat.qwik';

export type { CreateUIMessage, UIMessage };

export type UseChatHelpers<UI_MESSAGE extends UIMessage> = {
  /**
   * The id of the chat.
   */
  readonly id: string;

  /**
   * Update the `messages` state locally. This is useful when you want to
   * edit the messages on the client, and then trigger the `reload` method
   * manually to regenerate the AI response.
   */
  setMessages: (
    messages: UI_MESSAGE[] | ((messages: UI_MESSAGE[]) => UI_MESSAGE[]),
  ) => void;

  error: Error | undefined;

  /** The current value of the input */
  input: string;
  
  /** setState-powered method to update the input value */
  setInput: (input: string) => void;
  
  /**
   * An input/textarea-ready onChange handler to control the value of the input
   */
  handleInputChange: (event: Event) => void;

  /**
   * Form submission handler to automatically reset input and append a user message
   */
  handleSubmit: (event?: { preventDefault?: () => void }) => void;

  /** Whether the API request is in progress */
  isLoading: boolean;
} & Pick<
  AbstractChat<UI_MESSAGE>,
  | 'sendMessage'
  | 'regenerate'
  | 'stop'
  | 'resumeStream'
  | 'addToolResult'
  | 'status'
  | 'messages'
  | 'clearError'
>;

export type UseChatOptions<UI_MESSAGE extends UIMessage> = (
  | { chat: Chat<UI_MESSAGE> }
  | ChatInit<UI_MESSAGE>
) & {
  /**
   * Custom throttle wait in ms for the chat messages and data updates.
   * Default is undefined, which disables throttling.
   */
  experimental_throttle?: number;

  /**
   * Whether to resume an ongoing chat generation stream.
   */
  resume?: boolean;

  /**
   * An optional string for the initial input value.
   */
  initialInput?: string;
};

export function useChat<UI_MESSAGE extends UIMessage = UIMessage>({
  experimental_throttle: throttleWaitMs,
  resume = false,
  initialInput = '',
  ...options
}: UseChatOptions<UI_MESSAGE> = {}): UseChatHelpers<UI_MESSAGE> {
  const chatRef = useSignal<Chat<UI_MESSAGE>>(
    'chat' in options ? options.chat : Chat.create(options),
  );

  const state = useStore({
    messages: chatRef.value.messages,
    status: chatRef.value.status,
    error: chatRef.value.error,
    input: initialInput,
  });

  const shouldRecreateChat =
    ('chat' in options && options.chat !== chatRef.value) ||
    ('id' in options && chatRef.value.id !== options.id);

  if (shouldRecreateChat) {
    chatRef.value = 'chat' in options ? options.chat : Chat.create(options);
  }

  const optionsId = 'id' in options ? options.id : null;

  // Set up subscriptions to chat state changes
  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(({ cleanup, track }) => {
    track(() => optionsId);
    track(() => throttleWaitMs);
    
    const unsubscribeMessages = chatRef.value['~registerMessagesCallback'](
      () => {
        state.messages = chatRef.value.messages;
      },
      throttleWaitMs,
    );

    const unsubscribeStatus = chatRef.value['~registerStatusCallback'](() => {
      state.status = chatRef.value.status;
    });

    const unsubscribeError = chatRef.value['~registerErrorCallback'](() => {
      state.error = chatRef.value.error;
    });

    cleanup(() => {
      unsubscribeMessages();
      unsubscribeStatus();
      unsubscribeError();
    });
  });

  // Handle resume functionality
  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(({ track }) => {
    track(() => resume);
    if (resume) {
      chatRef.value.resumeStream();
    }
  });

  const setMessages = $((
    messagesParam: UI_MESSAGE[] | ((messages: UI_MESSAGE[]) => UI_MESSAGE[]),
  ) => {
    if (typeof messagesParam === 'function') {
      messagesParam = messagesParam(chatRef.value.messages);
    }
    chatRef.value.messages = messagesParam;
  });

  const setInput = $((input: string) => {
    state.input = input;
  });

  const handleInputChange = $((e: Event) => {
    const target = e.target as HTMLInputElement | HTMLTextAreaElement;
    state.input = target.value;
  });

  const handleSubmit = $((event?: { preventDefault?: () => void }) => {
    event?.preventDefault?.();
    if (state.input.trim()) {
      chatRef.value.sendMessage({ content: state.input, role: 'user' });
      state.input = '';
    }
  });

  return {
    id: chatRef.value.id,
    messages: state.messages,
    setMessages,
    sendMessage: chatRef.value.sendMessage,
    regenerate: chatRef.value.regenerate,
    clearError: chatRef.value.clearError,
    stop: chatRef.value.stop,
    error: state.error,
    resumeStream: chatRef.value.resumeStream,
    status: state.status,
    addToolResult: chatRef.value.addToolResult,
    input: state.input,
    setInput,
    handleInputChange,
    handleSubmit,
    isLoading: state.status === 'awaiting_message' || state.status === 'in_progress',
  };
}