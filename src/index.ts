import WebSocket from "ws";

export interface GosocksMessage {
    action: SendMessageAction | JoinChannelAction | LeaveChannelAction | MemberAddedAction | MemberRemovedAction | JoinChannelPrivateAction | ChannelJoinedAction;
    name?: string;
    event: string;
    data: string;
    target?: GosocksChannel;
    sender?: GosocksClient;
    timestamp?: number;
}

export interface GosocksChannel {
    id?: string;
    name?: string;
    clients?: Map<String, GosocksClient>;
    private: boolean;
}

export interface GosocksClient {
    readonly id: string;
    channels?: GosocksChannel[] | null;
}

export interface GosocksOpenEvent extends Event { }
export interface GosocksCloseEvent {
    code: number;
    reason: Buffer;
}
export interface GosocksErrorEvent extends Error { }

export type SendMessageAction = "send_message"
export type JoinChannelAction = "join_channel"
export type LeaveChannelAction = "leave_channel"
export type MemberAddedAction = "member_added"
export type MemberRemovedAction = "member_removed"
export type JoinChannelPrivateAction = "join_channel_private"
export type ChannelJoinedAction = "channel_joined"

export enum WebsocketCloseCode {
    CLOSE_NORMAL = 1000,         //Successful operation / regular socket shutdown
    CLOSE_GOING_AWAY = 1001,     //Client is leaving (browser tab closing)
    CLOSE_PROTOCOL_ERROR = 1002, //Endpoint received a malformed frame
    CLOSE_UNSUPPORTED = 1003,    //Endpoint received an unsupported frame (e.g. binary-only endpoint received text frame)
    CLOSED_NO_STATUS = 1005,     //Expected close status, received none
    CLOSE_ABNORMAL = 1006,       //Close code frame has been received
    UNSUPPORTED_PAYLOAD = 1007,  //Endpoint received inconsistent message (e.g. malformed UTF-8)
    POLICY_VIOLATION = 1008,     //Generic code used for situations other than 1003 and 1009
    CLOSE_TOO_LARGE = 1009,      //Endpoint won't process large frame
    MANDATORY_EXTENSION = 1010,  //Client wanted an extension which server did not negotiate
    SERVER_ERROR = 1011,         //Internal server error while operating
    SERVICE_RESTART = 1012,      //Server/service is restarting
    TRY_AGAIN_LATER = 1013,      //Temporary server condition forced blocking client's request
    BAD_GATEWAY = 1014,          //Server acting as gateway received an invalid response
    TLS_HANDSHAKE_FAIL = 1015,   //Transport Layer Security handshake failure
}

export class GosocksEvent {
    channelName: string;
    eventName: string;
    data: string | null;
    userId?: string | null;
    timestamp?: number;
    constructor(args: {
        channelName: string;
        eventName: string;
        data: string | null;
        userId?: string | null;
        timestamp?: number;
    }) {
        this.channelName = args.channelName;
        this.eventName = args.eventName;
        this.data = args.data || null;
        this.userId = args.userId || null;
        this.timestamp = args.timestamp || 0;
    }
    toString() {
        return `{ channelName: ${this.channelName}, eventName: ${this.eventName}, data: ${this.data}, userId: ${this.userId} }`;
    }
}

export class GosocksChannel implements GosocksChannel {
    public channelName: string;
    public private: boolean;
    public onEvent?: (event: GosocksEvent) => void;
    public onJoin?: (event: GosocksEvent) => void;
    public onMemberAdded?: (event: GosocksEvent) => void;
    public onMemberRemoved?: (event: GosocksEvent) => void;

    constructor(
        args: {
            channelName: string,
            onEvent?: (e: GosocksEvent) => void,
            onJoin?: (e: GosocksEvent) => void,
            onMemberAdded?: (e: GosocksEvent) => void,
            onMemberRemoved?: (e: GosocksEvent) => void,
        }
    ) {
        this.channelName = args.channelName;
        this.private = this.channelName.startsWith("private-");
        this.onEvent = args.onEvent;
        this.onJoin = args.onJoin;
        this.onMemberAdded = args.onMemberAdded;
        this.onMemberRemoved = args.onMemberRemoved;

    }

    public async unsubscribe() {
        return await Gosocks.getInstance().unsubscribe({
            channelName: this.channelName,
        });
    }

    public async send(data: unknown) {
        return await Gosocks.getInstance().sendToChannel({
            channelName: this.channelName,
            data: data
        });
    }
}

export class Gosocks {
    private static instance: Gosocks;
    private ws: WebSocket | null = null;

    public channels = new Map<String, GosocksChannel>();

    static getInstance() {
        if (!Gosocks.instance) {
            Gosocks.instance = new Gosocks();
        }
        return Gosocks.instance;
    }

    private constructor() { }

    public init(
        args: {
            auth_key: string,
            useTLS?: boolean,
            onOpen?: () => void,
            onClose?: (e: { code: number, reason: Buffer }) => void,
            onError?: (e: GosocksErrorEvent) => void,
            onEvent?: (e: GosocksEvent) => void,
        }
    ) {
        //`wss://gosocks.io/ws?bearer=${args.auth_key}`
        this.ws = this.ws ?? new WebSocket(`ws://localhost/ws?bearer=${args.auth_key}`, {
            port: args.useTLS ? 443 : 80,
            origin: "gosocks-ts-client"
        });

        this.ws.on("open", () => {
            args.onOpen?.();
        });

        this.ws.on("close", (code: number, reason: Buffer) => {
            args.onClose?.({ code: code, reason: reason });
        });

        this.ws.on("error", (error: Error) => {
            args.onError?.(error as GosocksErrorEvent);
        });

        this.ws.on("unexpected-response", (request: any, response: any) => {
            console.error("unexpected-response", request, response);

            if (this.getState() !== "CONNECTING") {
                this.disconnect({ gracefully: false });
            }
        });

        this.ws.on("message", (data: WebSocket.RawData, isBinary: boolean) => {
            const messageArray = this.splitWebsocketMessages(isBinary ? data.toString() : data.toString("utf8"));

            for (let i = 0; i < messageArray.length; i++) {
                const message: GosocksMessage = JSON.parse(messageArray[i]);
                const channel = this.channels.get(message.name ?? message.target?.name ?? "");
                const gosocksEvent = new GosocksEvent({
                    channelName: channel?.channelName || message?.name || "",
                    eventName: message?.event || "",
                    data: message?.data && typeof message?.data === "string"
                        ? JSON.parse(message.data)
                        : null,
                    userId: message?.sender?.id || null,
                    timestamp: message?.timestamp || 0,
                });

                args.onEvent?.(gosocksEvent);

                // Handle message internally here
                switch (message.action) {
                    case "send_message":
                        channel?.onEvent?.(gosocksEvent);
                        break;
                    case "member_added":
                        channel?.onMemberAdded?.(gosocksEvent);
                        if (!gosocksEvent?.channelName || !message.sender) break;
                        channel?.clients?.set(gosocksEvent.channelName, message.sender);
                        break;
                    case "member_removed":
                        channel?.onMemberRemoved?.(gosocksEvent);
                        if (!gosocksEvent?.channelName) break;
                        channel?.clients?.delete(gosocksEvent.channelName);
                        break;
                    case "join_channel_private":
                        channel?.onJoin?.(gosocksEvent);
                        break;
                    case "channel_joined":
                        channel?.onJoin?.(gosocksEvent);
                        break;
                    default:
                        break;
                }
            }
        });
    }

    public subscribe(
        args: {
            channelName: string,
            onEvent?: (e: GosocksEvent) => void,
            onJoin?: (e: GosocksEvent) => void,
            onMemberAdded?: (e: GosocksEvent) => void,
            onMemberRemoved?: (e: GosocksEvent) => void,
        }
    ): GosocksChannel {
        const channel = this.channels.get(args.channelName);

        if (channel) {
            return channel;
        }

        const newChannel = new GosocksChannel({
            channelName: args.channelName,
            onEvent: args.onEvent,
            onJoin: args.onJoin,
            onMemberAdded: args.onMemberAdded,
            onMemberRemoved: args.onMemberRemoved,
        });

        this.channels.set(args.channelName, newChannel);

        return newChannel;
    }

    public async unsubscribe({ channelName }: { channelName: string }): Promise<Error | undefined> {
        const channel = this.channels.get(channelName);

        if (!channel) {
            console.error(`Channel ${channelName} does not exist`);
            return;
        }

        const message: GosocksMessage = {
            action: "leave_channel",
            name: channelName,
            event: "leave_channel",
            data: "",
        };

        const result = await this.fireWsMessage(message);

        if (result instanceof Error) {
            console.error(result);
        } else {
            this.channels.delete(channelName);
        }

        return result;
    }

    public connect() {
        this.channels.forEach(async (channel) => {
            const action = channel.private ? "join_channel_private" : "join_channel";
            const message: GosocksMessage = {
                action: action,
                name: channel.channelName,
                event: action,
                data: "",
            };

            const result = await this.fireWsMessage(message);

            if (result instanceof Error) {
                console.error(result);
            }
        });
    }

    public disconnect({ gracefully = true }: { gracefully?: boolean } = {}) {
        this.ws?.off("open", () => { });
        this.ws?.off("close", () => { });
        this.ws?.off("message", () => { });
        this.ws?.off("error", () => { });
        this.ws?.off("unexpected-response", () => { });

        if (gracefully) {
            this.ws?.close(WebsocketCloseCode.CLOSE_NORMAL);
        } else {
            this.ws?.terminate();
        }
    }

    public async sendToChannel({ channelName, data }: { channelName: string, data?: unknown }): Promise<Error | undefined> {
        const channel = this.channels.get(channelName);

        if (!channel) {
            console.error(`Channel ${channelName} does not exist`);
            return;
        }

        if (channel && !channel.private) {
            console.error(`Peer to Peer messages are only supported on private channels`);
            return;
        }

        const message: GosocksMessage = {
            action: "send_message",
            name: channelName,
            event: "message",
            data: data ? JSON.stringify(data) : "",
        };

        const result = await this.fireWsMessage(message);

        if (result instanceof Error) {
            console.error(result);
        }

        return result;
    }

    public sendToAllChannels(data: unknown): void {
        this.channels.forEach((channel) => {
            this.sendToChannel({ channelName: channel.channelName, data: data });
        });
    }

    public getState(): string {
        switch (this.ws?.readyState) {
            case WebSocket.CONNECTING:
                return "CONNECTING";
            case WebSocket.OPEN:
                return "OPEN";
            case WebSocket.CLOSING:
                return "CLOSING";
            case WebSocket.CLOSED:
                return "CLOSED";
            default:
                return "CLOSED";
        }
    }

    private async fireWsMessage(message: GosocksMessage): Promise<Error | undefined> {
        return new Promise<Error | undefined>((resolve) => {
            const buffer = Buffer.from(JSON.stringify(message));
            this.ws?.send(buffer, (error) => {
                resolve(error);
            });
        });
    }

    private splitWebsocketMessages(message: string): string[] {
        if (message.includes("}+{")) {
            // needs to split on every instance of "}+{" but preserve the braces
            const splitMessage = message.split("}+{");
            const result = [];

            for (let i = 0; i < splitMessage.length; i++) {
                if (i === 0) {
                    result.push(splitMessage[i] + "}");
                } else if (i === splitMessage.length - 1) {
                    result.push("{" + splitMessage[i]);
                } else {
                    result.push("{" + splitMessage[i] + "}");
                }
            }

            return result;
        }

        return [message];
    }
}