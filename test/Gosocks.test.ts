import { Gosocks, GosocksEvent } from '../src/index';

/*
describe('Gosocks', () => {
  let gosocks: Gosocks;

  beforeEach(() => {
    gosocks = Gosocks.getInstance();
  });

  afterEach(() => {
    gosocks.disconnect();
  });

  it('should initialize with default values', () => {
    expect(gosocks.channels.size).toBe(0);
    //expect(gosocks.ws).toBeNull();
  });

  it('should subscribe to a public channel', () => {
    const channelName = 'test-channel';
    const channel = gosocks.subscribe({ channelName });

    expect(gosocks.channels.size).toBe(1);
    expect(gosocks.channels.get(channelName)).toBe(channel);
    expect(channel.private).toBe(false);
  });

  it('should subscribe to a private channel', () => {
    const channelName = 'private-channel';
    const channel = gosocks.subscribe({ channelName });

    expect(gosocks.channels.size).toBe(2);
    expect(gosocks.channels.get(channelName)).toBe(channel);
    expect(channel.private).toBe(true);
  });

  it('should unsubscribe from a channel', async () => {
    const channelName = 'test-channel';
    gosocks.subscribe({ channelName });

    await gosocks.unsubscribe({ channelName });

    expect(gosocks.channels.size).toBe(0);
    expect(gosocks.channels.get(channelName)).toBeUndefined();
  });

  it('should connect to the WebSocket server', () => {
    gosocks.init({ auth_key: 'test-auth-key' });

    expect(gosocks.getState()).toBe('CONNECTING');
  });

  it('should send a message to a channel', async () => {
    const channelName = 'test-channel';
    const data = { message: 'Hello, world!' };
    const channel = gosocks.subscribe({ channelName });

    const result = await gosocks.sendToChannel({ channelName, data });

    expect(result).toBeUndefined();
    expect(channel.onEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        channelName,
        eventName: 'message',
        data,
      })
    );
  });

  it('should send a message to all channels', () => {
    const data = { message: 'Hello, world!' };
    const channel1 = gosocks.subscribe({ channelName: 'channel1' });
    const channel2 = gosocks.subscribe({ channelName: 'channel2' });

    gosocks.sendToAllChannels(data);

    expect(channel1.onEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventName: 'message',
        data,
      })
    );
    expect(channel2.onEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventName: 'message',
        data,
      })
    );
  });

  it('should disconnect from the WebSocket server', () => {
    gosocks.init({ auth_key: 'test-auth-key' });
    gosocks.disconnect();

    expect(gosocks.getState()).toBe('CLOSED');
  });

  describe('splitWebsocketMessages', () => {
    it('should split the message on every instance of "}+{" and preserve the braces', () => {
      const message = '{"key1":"value1"}+{"key2":"value2"}+{"key3":"value3"}';

      const result = gosocks.splitWebsocketMessages(message);

      expect(result).toEqual([
        '{"key1":"value1"}',
        '{"key2":"value2"}',
        '{"key3":"value3"}',
      ]);
    });

    it('should return the original message if it does not contain "}+{"', () => {
      const gosocks = gosocks.init({ auth_key: 'test-auth-key' });
      const message = '{"key1":"value1"}';

      const result = gosocks.splitWebsocketMessages(message);

      expect(result).toEqual([message]);
    });
  });
});
*/