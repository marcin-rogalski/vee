import { Box, Text, useInput } from "ink";
import SelectInput from "ink-select-input";
import TextInput from "ink-text-input";
import React, { useEffect, useState } from "react";
import { type AppConfig, type ModelConfig, createClient } from "../client.js";

type Client = ReturnType<typeof createClient>;

type Props = {
  client: Client;
  onBack: () => void;
};

type Mode = "menu" | "switch" | "add" | "remove";

type AddField = "id" | "apiKey" | "baseUrl" | "name";

const ADD_FIELDS: AddField[] = ["id", "apiKey", "baseUrl", "name"];

const FIELD_LABELS: Record<AddField, string> = {
  id: "Model ID",
  apiKey: "API Key",
  baseUrl: "Base URL",
  name: "Name",
};

const FIELD_DEFAULTS: Partial<Record<AddField, string>> = {
  baseUrl: "http://host.docker.internal:1234/v1",
  name: "local-model",
};

const MENU_ITEMS = [
  { label: "Switch active model", value: "switch" },
  { label: "Add model", value: "add" },
  { label: "Remove model", value: "remove" },
  { label: "Back", value: "back" },
];

type SaveStatus = "idle" | "saving" | "saved" | "removed";

export function ConfigScreen({ client, onBack }: Props) {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<Mode>("menu");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");

  const [addFieldIndex, setAddFieldIndex] = useState(0);
  const [addValues, setAddValues] = useState<Record<AddField, string>>({
    id: "",
    apiKey: "",
    baseUrl: FIELD_DEFAULTS.baseUrl ?? "",
    name: FIELD_DEFAULTS.name ?? "",
  });
  const [currentFieldValue, setCurrentFieldValue] = useState("");

  useEffect(() => {
    client.getConfig().then((cfg) => {
      setConfig(cfg);
      setLoading(false);
    });
  }, []);

  useInput((_input, key) => {
    if (!key.escape) return;
    if (mode === "menu") {
      onBack();
    } else {
      setMode("menu");
      setSaveStatus("idle");
    }
  });

  if (loading || config === null) {
    return (
      <Box padding={1}>
        <Text>Loading...</Text>
      </Box>
    );
  }

  const activeModel = config.models.find((m) => m.active);

  const showSaved = () => {
    setTimeout(() => setSaveStatus("idle"), 1500);
  };

  const handleMenuSelect = (item: { label: string; value: string }) => {
    if (item.value === "back") {
      onBack();
      return;
    }
    if (item.value === "remove" && config.models.length === 0) {
      return;
    }
    if (item.value === "add") {
      setAddFieldIndex(0);
      setAddValues({
        id: "",
        apiKey: "",
        baseUrl: FIELD_DEFAULTS.baseUrl ?? "",
        name: FIELD_DEFAULTS.name ?? "",
      });
      setCurrentFieldValue("");
    }
    setMode(item.value as Mode);
  };

  const handleSwitchSelect = async (item: { label: string; value: string }) => {
    const picked = item.value;
    setSaveStatus("saving");

    const updatedModels: ModelConfig[] = config.models.map((m) => {
      if (m.id === picked) {
        return { ...m, active: true };
      }
      const { active: _a, ...rest } = m;
      return rest as ModelConfig;
    });

    const updated = await client.patchConfig({ models: updatedModels });
    setConfig(updated);
    setSaveStatus("saved");
    showSaved();
  };

  const handleAddFieldSubmit = async (value: string) => {
    const field = ADD_FIELDS[addFieldIndex] as AddField;
    const newValues: Record<AddField, string> = { ...addValues, [field]: value };
    setAddValues(newValues);

    if (addFieldIndex < ADD_FIELDS.length - 1) {
      const nextField = ADD_FIELDS[addFieldIndex + 1] as AddField;
      setCurrentFieldValue(newValues[nextField]);
      setAddFieldIndex(addFieldIndex + 1);
      return;
    }

    const newModel: ModelConfig = {
      id: newValues.id,
      type: "openai",
      apiKey: newValues.apiKey,
      baseUrl: newValues.baseUrl,
      name: newValues.name,
    };

    setSaveStatus("saving");
    const updated = await client.patchConfig({
      models: [...config.models, newModel],
    });
    setConfig(updated);
    setSaveStatus("saved");
    setMode("menu");
    showSaved();
  };

  const handleRemoveSelect = async (item: { label: string; value: string }) => {
    const removedId = item.value;
    setSaveStatus("saving");

    const filteredModels: ModelConfig[] = config.models
      .filter((m) => m.id !== removedId)
      .map((m) => {
        const { active: _a, ...rest } = m;
        return rest as ModelConfig;
      });

    const updated = await client.patchConfig({ models: filteredModels });
    setConfig(updated);
    setSaveStatus("removed");
    setMode("menu");
    showSaved();
  };

  const modelItems = config.models.map((m) => ({
    label: `${m.name} (${m.id})${m.active ? " ✓" : ""}`,
    value: m.id,
  }));

  const menuItems =
    config.models.length === 0
      ? MENU_ITEMS.map((item) =>
          item.value === "remove"
            ? { label: "Remove model (no models)", value: "remove" }
            : item
        )
      : MENU_ITEMS;

  return (
    <Box flexDirection="column" padding={1}>
      <Text bold>Config</Text>
      <Box marginTop={1} flexDirection="column">
        <Text>
          Active model:{" "}
          <Text color="green">{activeModel?.id ?? "none"}</Text>
        </Text>
        <Text>Token limit: {config.tokenLimit}</Text>
      </Box>

      {mode === "menu" && (
        <Box marginTop={1} flexDirection="column">
          <SelectInput
            items={menuItems}
            isFocused={saveStatus === "idle"}
            onSelect={handleMenuSelect}
          />
        </Box>
      )}

      {mode === "switch" && (
        <Box marginTop={1} flexDirection="column">
          <Text bold>Select active model:</Text>
          <SelectInput
            items={modelItems}
            isFocused={saveStatus === "idle"}
            onSelect={handleSwitchSelect}
          />
        </Box>
      )}

      {mode === "add" && (
        <Box marginTop={1} flexDirection="column">
          <Text bold>Add model</Text>
          <Box marginTop={1} flexDirection="column">
            {ADD_FIELDS.slice(0, addFieldIndex).map((f) => (
              <Text key={f} dimColor>
                {FIELD_LABELS[f]}: {addValues[f]}
              </Text>
            ))}
            <Box>
              <Text>{FIELD_LABELS[ADD_FIELDS[addFieldIndex] as AddField]}: </Text>
              <TextInput
                value={currentFieldValue}
                onChange={setCurrentFieldValue}
                onSubmit={handleAddFieldSubmit}
                focus={saveStatus === "idle"}
              />
            </Box>
          </Box>
        </Box>
      )}

      {mode === "remove" && (
        <Box marginTop={1} flexDirection="column">
          <Text bold>Remove model:</Text>
          <SelectInput
            items={modelItems}
            isFocused={saveStatus === "idle"}
            onSelect={handleRemoveSelect}
          />
        </Box>
      )}

      {saveStatus === "saving" && <Text color="yellow">Saving...</Text>}
      {saveStatus === "saved" && <Text color="green">Saved!</Text>}
      {saveStatus === "removed" && <Text color="green">Removed!</Text>}
      <Text dimColor>Esc to go back</Text>
    </Box>
  );
}
