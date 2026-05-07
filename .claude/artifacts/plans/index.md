# Plans index

| Slug | Status | Summary | last_synced |
|---|---|---|---|
| http-endpoint-refactor | implemented | Make Endpoint an abstract return-based controller; add SSE schema; wire DI for message endpoint. | f3140b8 |
| hexagonal-alignment | implemented | Apply .port/.dto/.usecase/.adapter/.endpoint file suffixes; extract DTOs; sealed Endpoint with typed()/create(). | f3140b8 |
| infrastructure-ports | implemented | MongoDB session repository, file+env config adapter, no-op tool manager stub, composition root wiring. | 61f79b4 |
| model-selection-config-api | implemented | Models array in config with active flag; composition root wires active adapter; GET /config and PATCH /config endpoints | ffff3cf |
| telemetry-and-context-logging | implemented | LoggerPort in application layer; ConsoleLogger adapter; chat.turn + http.request + app.start log entries; token stats on context | ffff3cf |
| cli-dev-tool | implemented | Dev CLI in cli/ — config show/set-model and streaming chat against the vee API | b960dc8 |
| config-hot-reload | draft | In-memory ConfigService + ModelFactory port so PATCH /config takes effect without restart | b960dc8 |
| cli-interactive | draft | Upsert-based session repo, GET/POST /sessions, full ink interactive CLI replacing commander | b960dc8 |
