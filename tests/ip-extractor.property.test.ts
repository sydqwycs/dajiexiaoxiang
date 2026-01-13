import * as fc from 'fast-check';
import { extractIP, normalizeIP } from '../src/utils/ip-extractor';
import { Request } from 'express';

// Feature: dajiexianxiang-choice, Property 21: IP 地址提取优先级
// Validates: Requirements 9.1, 9.2, 9.3, 9.4

describe('IP Extractor Property Tests', () => {
  // 生成 IPv4 地址
  const ipv4Arbitrary = fc.tuple(
    fc.integer({ min: 0, max: 255 }),
    fc.integer({ min: 0, max: 255 }),
    fc.integer({ min: 0, max: 255 }),
    fc.integer({ min: 0, max: 255 })
  ).map(([a, b, c, d]) => `${a}.${b}.${c}.${d}`);

  // 生成 IPv6 地址（简化版）
  const ipv6Arbitrary = fc.array(fc.hexaString({ minLength: 1, maxLength: 4 }), {
    minLength: 8,
    maxLength: 8
  }).map(segments => segments.join(':'));

  test('Property 21: x-forwarded-for 优先级最高', () => {
    fc.assert(
      fc.property(ipv4Arbitrary, ipv4Arbitrary, ipv4Arbitrary, (forwardedIP, realIP, socketIP) => {
        const mockReq = {
          headers: {
            'x-forwarded-for': forwardedIP,
            'x-real-ip': realIP
          },
          socket: { remoteAddress: socketIP },
          connection: { remoteAddress: socketIP }
        } as unknown as Request;

        const result = extractIP(mockReq);
        expect(result).toBe(forwardedIP);
      }),
      { numRuns: 100 }
    );
  });

  test('Property 21: x-real-ip 作为第二优先级', () => {
    fc.assert(
      fc.property(ipv4Arbitrary, ipv4Arbitrary, (realIP, socketIP) => {
        const mockReq = {
          headers: {
            'x-real-ip': realIP
          },
          socket: { remoteAddress: socketIP },
          connection: { remoteAddress: socketIP }
        } as unknown as Request;

        const result = extractIP(mockReq);
        expect(result).toBe(realIP);
      }),
      { numRuns: 100 }
    );
  });

  test('Property 21: socket 地址作为最后回退', () => {
    fc.assert(
      fc.property(ipv4Arbitrary, (socketIP) => {
        const mockReq = {
          headers: {},
          socket: { remoteAddress: socketIP },
          connection: { remoteAddress: socketIP }
        } as unknown as Request;

        const result = extractIP(mockReq);
        expect(result).toBe(socketIP);
      }),
      { numRuns: 100 }
    );
  });

  test('Property 21: x-forwarded-for 多个 IP 时取第一个', () => {
    fc.assert(
      fc.property(
        fc.array(ipv4Arbitrary, { minLength: 2, maxLength: 5 }),
        (ips) => {
          const forwardedFor = ips.join(', ');
          const mockReq = {
            headers: {
              'x-forwarded-for': forwardedFor
            },
            socket: { remoteAddress: '127.0.0.1' },
            connection: { remoteAddress: '127.0.0.1' }
          } as unknown as Request;

          const result = extractIP(mockReq);
          expect(result).toBe(ips[0]);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 22: IPv6 地址规范化为小写', () => {
    fc.assert(
      fc.property(ipv6Arbitrary, (ipv6) => {
        const normalized = normalizeIP(ipv6);
        expect(normalized).toBe(ipv6.toLowerCase());
      }),
      { numRuns: 100 }
    );
  });

  test('Property 22: IPv4-mapped IPv6 地址移除前缀', () => {
    fc.assert(
      fc.property(ipv4Arbitrary, (ipv4) => {
        const mappedIPv6 = `::ffff:${ipv4}`;
        const normalized = normalizeIP(mappedIPv6);
        expect(normalized).toBe(ipv4);
      }),
      { numRuns: 100 }
    );
  });

  test('Property 22: IPv4 地址保持不变', () => {
    fc.assert(
      fc.property(ipv4Arbitrary, (ipv4) => {
        const normalized = normalizeIP(ipv4);
        expect(normalized).toBe(ipv4);
      }),
      { numRuns: 100 }
    );
  });
});
