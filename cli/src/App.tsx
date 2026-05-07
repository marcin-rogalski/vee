import { Box, Text } from "ink";
import SelectInput from "ink-select-input";
import React, { useState } from "react";
import { createClient } from "./client.js";
import { ConfigScreen } from "./screens/ConfigScreen.js";
import { SessionScreen } from "./screens/SessionScreen.js";
import { ChatScreen } from "./screens/ChatScreen.js";

type Screen = "menu" | "config" | "sessions" | "chat";

type Client = ReturnType<typeof createClient>;

type Props = {
  client: Client;
};

const menuItems = [
  { label: "Config", value: "config" },
  { label: "Chat", value: "sessions" },
];

export function App({ client }: Props) {
  const [screen, setScreen] = useState<Screen>("menu");
  const [sessionId, setSessionId] = useState<string | null>(null);

  if (screen === "config") {
    return <ConfigScreen client={client} onBack={() => setScreen("menu")} />;
  }

  if (screen === "sessions") {
    return (
      <SessionScreen
        client={client}
        onBack={() => setScreen("menu")}
        onSelectSession={(id) => {
          setSessionId(id);
          setScreen("chat");
        }}
      />
    );
  }

  if (screen === "chat" && sessionId !== null) {
    return (
      <ChatScreen
        client={client}
        sessionId={sessionId}
        onBack={() => setScreen("sessions")}
      />
    );
  }

  return (
    <Box flexDirection="column" padding={1}>
      <Text bold>vee</Text>
      <SelectInput
        items={menuItems}
        onSelect={(item) => setScreen(item.value as Screen)}
      />
    </Box>
  );
}
