type ChatEntry =
	| { author: "system"; content: string }
	| { author: "user" | "assistant"; content: string; ts: number }
	| {
			author: "tool-call";
			id: string;
			name: string;
			arguments: object;
			ts: number;
	  }
	| {
			author: "tool-result";
			id: string;
			result: string;
			ts: number;
	  };

export default ChatEntry;
