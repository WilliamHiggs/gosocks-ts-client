import WebSocket from "ws";
import { Event, MessageEvent, CloseEvent } from "ws";


export interface GosocksMessage {
    action: SendMessageAction | JoinChannelAction | LeaveChannelAction | MemberAddedAction | MemberRemovedAction | JoinChannelPrivateAction | ChannelJoinedAction;
    event: string;
    data: any;
    target?: GosocksChannel;
    sender?: GosocksClient;
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
export interface GosocksCloseEvent extends CloseEvent { }
export interface GosocksErrorEvent extends Event { }
export interface GosocksMessageEvent extends MessageEvent { }

export type SendMessageAction = "send_message"
export type JoinChannelAction = "join_channel"
export type LeaveChannelAction = "leave_channel"
export type MemberAddedAction = "member_added"
export type MemberRemovedAction = "member_removed"
export type JoinChannelPrivateAction = "join_channel_private"
export type ChannelJoinedAction = "channel_joined"

export class GosocksEvent {
    channelName: string;
    eventName: string;
    data: any;
    userId?: string;
    constructor(args: {
        channelName: string;
        eventName: string;
        data: any;
        userId?: string;
    }) {
        this.channelName = args.channelName;
        this.eventName = args.eventName;
        this.data = args.data;
        this.userId = args.userId;
    }
    toString() {
        return `{ channelName: ${this.channelName}, eventName: ${this.eventName}, data: ${this.data}, userId: ${this.userId} }`;
    }
}

export class GosocksChannel implements GosocksChannel {
    channelName: string;
    private: boolean;
    onEvent?: (event: any) => void;
    onMemberAdded?: (channelName: string, userId: string | undefined) => void;
    onMemberRemoved?: (channelName: string, userId: string | undefined) => void;

    constructor(
        args: {
            channelName: string,
            onEvent?: (e: GosocksEvent) => void,
            onJoin?: (e: GosocksEvent) => void,
            onLeave?: (e: GosocksEvent) => void,
            onMemberAdded?: (e: GosocksEvent) => void,
            onMemberRemoved?: (e: GosocksEvent) => void,
        }
    ) {
        this.channelName = args.channelName;
        this.private = this.channelName.startsWith("private-");
    }

    unsubscribe() {
        return Gosocks.getInstance().unsubscribe({
            channelName: this.channelName,
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
            onOpen?: (e: Event) => void,
            onClose?: (e: GosocksCloseEvent) => void,
            onError?: (e: GosocksErrorEvent) => void,
            onEvent?: (e: GosocksEvent) => void,
        }
    ) {
        this.ws = this.ws ?? new WebSocket(`wss://gosocks.io/ws?bearer=${args.auth_key}`, {
            port: args.useTLS ? 443 : 80,
            origin: "gosocks-ts-client"
        });

        this.ws.addEventListener("open", (event: Event) => {
            console.warn(event);
            args.onOpen?.(event);
        });

        this.ws.addEventListener("close", (event: CloseEvent) => {
            console.warn(event);
            args.onClose?.(event);
        });

        this.ws.addEventListener("error", (error: Event) => {
            console.warn(error);
            args.onError?.(error);
        });

        this.ws.addEventListener("message", (event: MessageEvent) => {
            const message: GosocksMessage = JSON.parse(event.data.toString());
            const channel = this.channels.get(message.target?.name ?? "");
            const gosocksEvent = new GosocksEvent({
                channelName: message.target?.name ?? "",
                eventName: message.event,
                data: message.data,
                userId: message.sender?.id,
            });

            console.warn(event);
            console.warn(message);

            // Handle message internally here
            switch (message.action) {
                case "send_message":
                    channel?.onEvent?.(gosocksEvent);
                    break;
                case "join_channel":
                    break;
                case "leave_channel":
                    break;
                case "member_added":
                    channel?.onMemberAdded?.(gosocksEvent.channelName, gosocksEvent.userId);
                    if (!gosocksEvent?.channelName || !message.sender) break;
                    channel?.clients?.set(gosocksEvent.channelName, message.sender);
                    break;
                case "member_removed":
                    channel?.onMemberRemoved?.(gosocksEvent.channelName, gosocksEvent.userId);
                    if (!gosocksEvent?.channelName) break;
                    channel?.clients?.delete(gosocksEvent.channelName);
                    break;
                case "join_channel_private":
                    break;
                case "channel_joined":
                    break;
                default:
                    break;
            }

            args.onEvent?.(gosocksEvent);
        });
    }

    public subscribe(
        args: {
            channelName: string,
            onEvent?: (e: GosocksEvent) => void,
            onJoin?: (e: GosocksEvent) => void,
            onLeave?: (e: GosocksEvent) => void,
            onMemberAdded?: (e: GosocksEvent) => void,
            onMemberRemoved?: (e: GosocksEvent) => void,
        }
    ) {
        const channel = this.channels.get(args.channelName);
        if (channel) {
            return channel;
        }

        const newChannel = new GosocksChannel(args);
        this.channels.set(args.channelName, newChannel);
        return newChannel;
    }

    public unsubscribe({ channelName }: { channelName: string }) {
        const channel = this.channels.get(channelName);
        if (channel) {
            this.ws?.send(JSON.stringify({ action: 'leave_channel', message: channelName }));
            this.channels.delete(channelName);
        }
        return channel;
    }

    public connect() {
        this.channels.forEach((channel) => {
            this.ws?.send(JSON.stringify({ action: 'join_channel', message: channel.channelName }));
        });
    }

    public disconnect() {
        this.ws?.removeEventListener("open", _ => { });
        this.ws?.removeEventListener("close", _ => { });
        this.ws?.removeEventListener("message", _ => { });
        this.ws?.removeEventListener("error", _ => { });
        this.ws?.close();
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
}