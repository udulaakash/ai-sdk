import { AbstractChat, type ChatInit, type CreateUIMessage, type UIMessage } from 'ai';
import { Chat } from './chat.qwik';
import { Signal, useSignal, useVisibleTask$ } from '@builder.io/qwik';

export type { CreateUIMessage, UIMessage };

export type UseChatHelpers<UI_MESSAGE extends UIMessage> = {
  readonly id: string;
  messages: Signal<UI_MESSAGE[]>;
  status: Signal<string>;
  error: Signal<Error | undefined>;
  setMessages: (
    messages: UI_MESSAGE[] | ((messages: UI_MESSAGE[]) => UI_MESSAGE[]),
  ) => void;
} & Pick<
  AbstractChat<UI_MESSAGE>,
  | 'sendMessage'
  | 'regenerate'
  | 'stop'
  | 'resumeStream'
  | 'addToolResult'
  | 'clearError'
>;

export type UseChatOptions<UI_MESSAGE extends UIMessage> = (
  | { chat: Chat<UI_MESSAGE> }
  | ChatInit<UI_MESSAGE>
) & {
  experimental_throttle?: number;
  resume?: boolean;
};

export function useChat<UI_MESSAGE extends UIMessage = UIMessage>({
  experimental_throttle: throttleWaitMs,
  resume = false,
  ...options
}: UseChatOptions<UI_MESSAGE> = {}): UseChatHelpers<UI_MESSAGE> {
  const chatSig = useSignal<Chat<UI_MESSAGE>>();

  // initialize or update chat instance if necessary
  if (chatSig.value == null) {
    chatSig.value = 'chat' in options ? options.chat : new Chat(options as ChatInit<UI_MESSAGE>);
  } else if (
    ('chat' in options && options.chat !== chatSig.value) ||
    ('id' in options && chatSig.value.id !== (options as ChatInit<UI_MESSAGE>).id)
  ) {
    chatSig.value = 'chat' in options ? options.chat : new Chat(options as ChatInit<UI_MESSAGE>);
  }

  const messages = useSignal<UI_MESSAGE[]>(chatSig.value.messages);
  const status = useSignal<string>(chatSig.value.status);
  const error = useSignal<Error | undefined>(chatSig.value.error);

  useVisibleTask$(({ cleanup }) => {
    if (!chatSig.value) return;

    // set initial values
    messages.value = chatSig.value.messages;
    status.value = chatSig.value.status;
    error.value = chatSig.value.error;

    const unsubMessages = (chatSig.value as any)['~registerMessagesCallback'](
      () => {
        messages.value = chatSig.value!.messages;
      },
      throttleWaitMs,
    );

    const unsubStatus = (chatSig.value as any)['~registerStatusCallback'](() => {
      status.value = chatSig.value!.status;
    });

    const unsubError = (chatSig.value as any)['~registerErrorCallback'](() => {
      error.value = chatSig.value!.error;
    });

    if (resume) {
      chatSig.value.resumeStream();
    }

    cleanup(() => {
      unsubMessages?.();
      unsubStatus?.();
      unsubError?.();
    });
  });

  const setMessages: UseChatHelpers<UI_MESSAGE>['setMessages'] = messagesParam => {
    const current = chatSig.value!.messages;
    const next = typeof messagesParam === 'function' ? (messagesParam as any)(current) : messagesParam;
    chatSig.value!.messages = next;
  };

  return {
    id: chatSig.value.id,
    messages,
    status,
    error,
    setMessages,
    sendMessage: chatSig.value.sendMessage,
    regenerate: chatSig.value.regenerate,
    clearError: chatSig.value.clearError,
    stop: chatSig.value.stop,
    resumeStream: chatSig.value.resumeStream,
    addToolResult: chatSig.value.addToolResult,
  } as UseChatHelpers<UI_MESSAGE>;
}