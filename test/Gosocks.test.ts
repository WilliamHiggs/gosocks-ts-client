import { Gosocks } from '../src/index';

it.todo("Connect tests with the live Gosocks server")
/*
describe('Gosocks', () => {
  let gosocks: Gosocks;

  beforeEach(() => {
    gosocks = Gosocks.getInstance();
  });

  afterEach(() => {
    gosocks.disconnect();
  });

  it('should initialize with a WebSocket connection', () => {
    const auth_key = 'test_auth_key';
    const onOpen = jest.fn();
    const onClose = jest.fn();
    const onError = jest.fn();
    const onEvent = jest.fn();

    gosocks.init({ auth_key, onOpen, onClose, onError, onEvent });

    expect(gosocks.getState()).toBe('CONNECTING');
  });

  it('should subscribe to a channel', () => {
    const channelName = 'test_channel';
    const onEvent = jest.fn();
    const onJoin = jest.fn();
    const onLeave = jest.fn();
    const onMemberAdded = jest.fn();
    const onMemberRemoved = jest.fn();

    const channel = gosocks.subscribe({
      channelName,
      onEvent,
      onJoin,
      onLeave,
      onMemberAdded,
      onMemberRemoved,
    });

    expect(channel.channelName).toBe(channelName);
    expect(gosocks.channels.get(channelName)).toBe(channel);
  });

  it('should unsubscribe from a channel', () => {
    const channelName = 'test_channel';
    const onEvent = jest.fn();
    const onJoin = jest.fn();
    const onLeave = jest.fn();
    const onMemberAdded = jest.fn();
    const onMemberRemoved = jest.fn();

    gosocks.subscribe({
      channelName,
      onEvent,
      onJoin,
      onLeave,
      onMemberAdded,
      onMemberRemoved,
    });

    const channel = gosocks.unsubscribe({ channelName });

    expect(channel?.channelName).toBe(channelName);
    expect(gosocks.channels.get(channelName)).toBeUndefined();
  });

  it('should connect to all subscribed channels', () => {
    const channelName1 = 'test_channel_1';
    const channelName2 = 'test_channel_2';
    const onEvent = jest.fn();
    const onJoin = jest.fn();
    const onLeave = jest.fn();
    const onMemberAdded = jest.fn();
    const onMemberRemoved = jest.fn();

    gosocks.subscribe({
      channelName: channelName1,
      onEvent,
      onJoin,
      onLeave,
      onMemberAdded,
      onMemberRemoved,
    });

    gosocks.subscribe({
      channelName: channelName2,
      onEvent,
      onJoin,
      onLeave,
      onMemberAdded,
      onMemberRemoved,
    });

    gosocks.connect();

    expect(gosocks.getState()).toBe('OPEN');
  });

  it('should disconnect from WebSocket', () => {
    const auth_key = 'test_auth_key';
    const onOpen = jest.fn();
    const onClose = jest.fn();
    const onError = jest.fn();
    const onEvent = jest.fn();

    gosocks.init({ auth_key, onOpen, onClose, onError, onEvent });
    gosocks.disconnect();

    expect(gosocks.getState()).toBe('CLOSED');
  });
});
*/