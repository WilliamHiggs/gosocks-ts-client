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

export interface GosocksEvent extends Event { }
export interface GosocksCloseEvent extends CloseEvent { }
export interface GosocksErrorEvent extends Event { }
export interface GosocksMessageEvent extends MessageEvent<any> { }

export type SendMessageAction = "send_message"
export type JoinChannelAction = "join_channel"
export type LeaveChannelAction = "leave_channel"
export type MemberAddedAction = "member_added"
export type MemberRemovedAction = "member_removed"
export type JoinChannelPrivateAction = "join_channel_private"
export type ChannelJoinedAction = "channel_joined"

export class GosocksChannel implements GosocksChannel {
    channelName: string;
    private: boolean;
    onEvent?: (event: any) => void;
    onMemberAdded?: (member: GosocksClient) => void;
    onMemberRemoved?: (member: GosocksClient) => void;

    constructor(
        args: {
            channelName: string,
            onEvent?: (e: GosocksMessageEvent) => void,
            onJoin?: (e: GosocksMessageEvent) => void,
            onLeave?: (e: GosocksMessageEvent) => void,
            onMemberAdded?: (e: GosocksMessageEvent) => void,
            onMemberRemoved?: (e: GosocksMessageEvent) => void,
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
            onOpen?: (e: GosocksEvent) => void,
            onClose?: (e: GosocksCloseEvent) => void,
            onError?: (e: GosocksErrorEvent) => void,
            onMessage?: (e: GosocksMessageEvent) => void,
        }
    ) {
        this.ws = this.ws ?? new WebSocket(`ws://gosocks.io/ws?bearer=${args.auth_key}`);

        this.ws.addEventListener("open", (event: Event) => {
            console.warn(event);
            args.onOpen?.(event);
        });

        this.ws.addEventListener("close", (event: CloseEvent) => {
            console.warn(event);
            args.onClose?.(event);
        });

        this.ws.addEventListener("message", (event: MessageEvent<any>) => {
            const message: GosocksMessage = JSON.parse(event.data);

            console.warn(event);
            console.warn(message);

            // Handle message internally here

            args.onMessage?.(event);
        });

        this.ws.addEventListener("error", (error: Event) => {
            console.warn(error);
            args.onError?.(error);
        });
    }

    public subscribe(
        args: {
            channelName: string,
            onEvent?: (e: GosocksMessageEvent) => void,
            onJoin?: (e: GosocksMessageEvent) => void,
            onLeave?: (e: GosocksMessageEvent) => void,
            onMemberAdded?: (e: GosocksMessageEvent) => void,
            onMemberRemoved?: (e: GosocksMessageEvent) => void,
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