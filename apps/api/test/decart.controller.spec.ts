jest.mock('@decartai/sdk', () => ({ createDecartClient: jest.fn() }));

import { createDecartClient } from '@decartai/sdk';
import { HttpException } from '@nestjs/common';
import { AiController } from '../src/modules/ai.controller';
import { DatabaseService } from '../src/database.service';

describe('Decart authentication', () => {
  const controller = new AiController({} as DatabaseService);
  const createToken = jest.fn();
  const previousEnv = { ...process.env };

  beforeEach(() => {
    process.env.DECART_API_KEY = 'unit-test-server-key';
    process.env.DECART_ALLOWED_ORIGINS = 'http://localhost:3000';
    jest.clearAllMocks();
    (createDecartClient as jest.Mock).mockReturnValue({ tokens: { create: createToken } });
  });
  afterEach(() => { process.env = { ...previousEnv }; });

  it('does not manufacture a token without a permanent key', async () => {
    delete process.env.DECART_API_KEY;
    await expect(controller.issueDecartToken({}, 'http://localhost:3000'))
      .rejects.toMatchObject({ status: 503 });
    expect(createDecartClient).not.toHaveBeenCalled();
    expect(controller.getDecartStatus()).toMatchObject({ configured: false, mode: 'unconfigured' });
  });

  it('rejects an unauthorized origin even when the body claims the shop domain', async () => {
    await expect(controller.issueDecartToken({ site: 'localhost' }, 'https://attacker.example'))
      .rejects.toMatchObject({ status: 403 });
    expect(createToken).not.toHaveBeenCalled();
  });

  it('rejects a forged site on an otherwise allowed origin', async () => {
    await expect(controller.issueDecartToken({ site: 'safework.ctslab.net' }, 'http://localhost:3000'))
      .rejects.toMatchObject({ status: 400 });
  });

  it('returns only the real upstream token and scopes it to origin and model', async () => {
    const expiresAt = new Date(Date.now() + 600000).toISOString();
    createToken.mockResolvedValue({ apiKey: 'upstream-client-token', expiresAt });
    await expect(controller.issueDecartToken({ site: 'localhost', installation_id: 'device-1' }, 'http://localhost:3000'))
      .resolves.toEqual({ apiKey: 'upstream-client-token', expiresAt, model: 'lucy-vton-3.5' });
    expect(createToken).toHaveBeenCalledWith({
      expiresIn: 600, allowedModels: ['lucy-vton-3.5'], allowedOrigins: ['http://localhost:3000'],
      metadata: { installation_id: 'device-1' },
    });
    expect(controller.getDecartStatus()).toMatchObject({ mode: 'ready', keyMasked: null });
  });

  it('reports token upstream failure instead of returning a random credential', async () => {
    createToken.mockRejectedValue(new Error('upstream rejected'));
    await expect(controller.issueDecartToken({}, 'http://localhost:3000'))
      .rejects.toMatchObject({ status: 502 });
  });

  it('rejects a malformed success response', async () => {
    createToken.mockResolvedValue({ apiKey: 'token', expiresAt: 'invalid' });
    await expect(controller.issueDecartToken({}, 'http://localhost:3000'))
      .rejects.toMatchObject({ status: 502 });
  });

  it('does not claim that an unimplemented photo job processed an image', async () => {
    await expect(controller.createDecartTryOnJob()).rejects.toBeInstanceOf(HttpException);
    await expect(controller.createDecartTryOnJob()).rejects.toMatchObject({ status: 501 });
  });

  it('rejects private-network image requests before fetching', async () => {
    const response = { status: jest.fn().mockReturnThis(), send: jest.fn() };
    await controller.proxyProductImage('http://127.0.0.1:4000/private', response as never);
    expect(response.status).toHaveBeenCalledWith(403);
  });
});
