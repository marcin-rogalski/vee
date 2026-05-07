import { Box, Text, useInput } from "ink";
import SelectInput from "ink-select-input";
import React, { useEffect, useState } from "react";
import { createClient } from "../client.js";

type Client = ReturnType<typeof createClient>;

type Props = {
  client: Client;
  onBack: () => void;
  onSelectSession: (sessionId: string) => void;
};

export function SessionScreen({ client, onBack, onSelectSession }: Props) {
  const [sessions, setSessions] = useState<string[] | null>(null);

  useEffect(() => {
    client.listSessions().then(setSessions);
  }, []);

  useInput((_input, key) => {
    if (key.escape) onBack();
  });

  if (sessions === null) {
    return (
      <Box padding={1}>
        <Text>Loading...</Text>
      </Box>
    );
  }

  const items = [
    { label: "New session", value: "__new__" },
    ...sessions.map((id) => ({ label: id, value: id })),
  ];

  const handleSelect = async (item: { label: string; value: string }) => {
    if (item.value === "__new__") {
      const id = await client.createSession();
      onSelectSession(id);
    } else {
      onSelectSession(item.value);
    }
  };

  return (
    <Box flexDirection="column" padding={1}>
      <Text bold>Sessions</Text>
      <Box marginTop={1}>
        <SelectInput items={items} onSelect={handleSelect} />
      </Box>
      <Text dimColor>Esc to go back</Text>
    </Box>
  );
}
