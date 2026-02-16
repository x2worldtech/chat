import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { User, Message, Chat } from '../backend';
import type { Principal } from '@dfinity/principal';

export function useUser(principal: Principal | undefined) {
  const { actor, isFetching } = useActor();

  return useQuery<User | null>({
    queryKey: ['user', principal?.toString()],
    queryFn: async () => {
      if (!actor || !principal) return null;
      return actor.getUserByPrincipal(principal);
    },
    enabled: !!actor && !isFetching && !!principal,
  });
}

export function useRegisterUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (username: string) => {
      if (!actor) throw new Error('Actor not initialized');
      await actor.registerUser(username);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });
}

export function useUpdateProfilePicture() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (path: string) => {
      if (!actor) throw new Error('Actor not initialized');
      await actor.updateProfilePicture(path);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });
}

export function useUpdateBio() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bio: string) => {
      if (!actor) throw new Error('Actor not initialized');
      await actor.updateBio(bio);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });
}

export function useSearchUser() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (searchTerm: string): Promise<User | null> => {
      if (!actor) throw new Error('Actor not initialized');
      
      // Try username first
      let user = await actor.getUserByUsername(searchTerm);
      if (user) return user;
      
      // Try as principal ID
      try {
        const { Principal } = await import('@dfinity/principal');
        const principal = Principal.fromText(searchTerm);
        user = await actor.getUserByPrincipal(principal);
        return user;
      } catch {
        return null;
      }
    },
  });
}

export function useFindExistingChat() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async ({ participant1, participant2 }: { participant1: Principal; participant2: Principal }): Promise<string | null> => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.findExistingChat(participant1, participant2);
    },
  });
}

export function useCreateChat() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (participant: Principal): Promise<string> => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.createChat(participant);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chats'] });
      queryClient.invalidateQueries({ queryKey: ['chatList'] });
    },
  });
}

export function useChatList() {
  const { actor, isFetching } = useActor();

  return useQuery<Chat[]>({
    queryKey: ['chatList'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getChatList();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 5000,
  });
}

export function useMessages(chatId: string | null) {
  const { actor, isFetching } = useActor();

  return useQuery<Message[]>({
    queryKey: ['messages', chatId],
    queryFn: async () => {
      if (!actor || !chatId) return [];
      return actor.getMessages(chatId);
    },
    enabled: !!actor && !isFetching && !!chatId,
    refetchInterval: 3000,
  });
}

export function useSendMessage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ chatId, content, sender }: { chatId: string; content: string; sender: Principal }) => {
      if (!actor) throw new Error('Actor not initialized');
      await actor.sendMessage(chatId, content);
    },
    onMutate: async ({ chatId, content, sender }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['messages', chatId] });

      // Snapshot the previous value
      const previousMessages = queryClient.getQueryData<Message[]>(['messages', chatId]);

      // Optimistically update to the new value
      const optimisticMessage: Message = {
        id: `optimistic-${Date.now()}-${Math.random()}`,
        sender,
        content,
        timestamp: BigInt(Date.now() * 1000000),
        encrypted: true,
      };

      queryClient.setQueryData<Message[]>(['messages', chatId], (old = []) => {
        return [...old, optimisticMessage];
      });

      // Return a context object with the snapshotted value
      return { previousMessages };
    },
    onError: (err, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousMessages) {
        queryClient.setQueryData(['messages', variables.chatId], context.previousMessages);
      }
    },
    onSettled: (_, __, variables) => {
      // Always refetch after error or success to ensure we have the correct data
      queryClient.invalidateQueries({ queryKey: ['messages', variables.chatId] });
      queryClient.invalidateQueries({ queryKey: ['chatList'] });
    },
  });
}

export function useDeleteMessageForEveryone() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ chatId, messageId }: { chatId: string; messageId: string }) => {
      if (!actor) throw new Error('Actor not initialized');
      await actor.deleteMessageForEveryone(chatId, messageId);
    },
    onMutate: async ({ chatId, messageId }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['messages', chatId] });

      // Snapshot the previous value
      const previousMessages = queryClient.getQueryData<Message[]>(['messages', chatId]);

      // Optimistically remove the message
      queryClient.setQueryData<Message[]>(['messages', chatId], (old = []) => {
        return old.filter(msg => msg.id !== messageId);
      });

      return { previousMessages };
    },
    onError: (err, variables, context) => {
      // If the mutation fails, roll back
      if (context?.previousMessages) {
        queryClient.setQueryData(['messages', variables.chatId], context.previousMessages);
      }
    },
    onSettled: (_, __, variables) => {
      // Refetch to ensure we have the correct data
      queryClient.invalidateQueries({ queryKey: ['messages', variables.chatId] });
      queryClient.invalidateQueries({ queryKey: ['chatList'] });
    },
  });
}

export function useDeleteMessageForMe() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ chatId, messageId }: { chatId: string; messageId: string }) => {
      if (!actor) throw new Error('Actor not initialized');
      await actor.deleteMessageForMe(messageId);
    },
    onMutate: async ({ chatId, messageId }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['messages', chatId] });

      // Snapshot the previous value
      const previousMessages = queryClient.getQueryData<Message[]>(['messages', chatId]);

      // Optimistically remove the message for the current user
      queryClient.setQueryData<Message[]>(['messages', chatId], (old = []) => {
        return old.filter(msg => msg.id !== messageId);
      });

      return { previousMessages };
    },
    onError: (err, variables, context) => {
      // If the mutation fails, roll back
      if (context?.previousMessages) {
        queryClient.setQueryData(['messages', variables.chatId], context.previousMessages);
      }
    },
    onSettled: (_, __, variables) => {
      // Refetch to ensure we have the correct data
      queryClient.invalidateQueries({ queryKey: ['messages', variables.chatId] });
      queryClient.invalidateQueries({ queryKey: ['chatList'] });
    },
  });
}

export function useDeleteChatForMe() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ chatId }: { chatId: string }) => {
      if (!actor) throw new Error('Actor not initialized');
      await actor.deleteChatForMe(chatId);
    },
    onMutate: async ({ chatId }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['chatList'] });

      // Snapshot the previous value
      const previousChats = queryClient.getQueryData<Chat[]>(['chatList']);

      // Optimistically remove the chat
      queryClient.setQueryData<Chat[]>(['chatList'], (old = []) => {
        return old.filter(chat => chat.id !== chatId);
      });

      return { previousChats };
    },
    onError: (err, variables, context) => {
      // If the mutation fails, roll back
      if (context?.previousChats) {
        queryClient.setQueryData(['chatList'], context.previousChats);
      }
    },
    onSettled: () => {
      // Refetch to ensure we have the correct data
      queryClient.invalidateQueries({ queryKey: ['chatList'] });
    },
  });
}

export function useDeleteChatForEveryone() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ chatId }: { chatId: string }) => {
      if (!actor) throw new Error('Actor not initialized');
      await actor.deleteChatForEveryone(chatId);
    },
    onMutate: async ({ chatId }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['chatList'] });

      // Snapshot the previous value
      const previousChats = queryClient.getQueryData<Chat[]>(['chatList']);

      // Optimistically remove the chat
      queryClient.setQueryData<Chat[]>(['chatList'], (old = []) => {
        return old.filter(chat => chat.id !== chatId);
      });

      return { previousChats };
    },
    onError: (err, variables, context) => {
      // If the mutation fails, roll back
      if (context?.previousChats) {
        queryClient.setQueryData(['chatList'], context.previousChats);
      }
    },
    onSettled: () => {
      // Refetch to ensure we have the correct data
      queryClient.invalidateQueries({ queryKey: ['chatList'] });
    },
  });
}
