import React, { createContext, useContext, useState } from "react";

export interface ChatStateContextType {
  currentConversationId: number | null;
  setCurrentConversationId: (id: number | null) => void;
}

const ChatStateContext = createContext<ChatStateContextType | undefined>(
  undefined
);

export const ChatStateProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [currentConversationId, setCurrentConversationId] = useState<
    number | null
  >(null);

  return (
    <ChatStateContext.Provider
      value={{ currentConversationId, setCurrentConversationId }}
    >
      {children}
    </ChatStateContext.Provider>
  );
};

export const useChatState = () => {
  const ctx = useContext(ChatStateContext);
  if (!ctx) {
    throw new Error("useChatState must be used inside ChatStateProvider");
  }
  return ctx;
};
