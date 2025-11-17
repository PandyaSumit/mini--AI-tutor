/**
 * Unit Tests for MCP Server
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { MCPServer } from '../../../ai/mcp/core/mcpServer.js';
import { z } from 'zod';

describe('MCPServer', () => {
  let server;

  beforeEach(() => {
    server = new MCPServer('test-server', 'Test MCP Server');
  });

  describe('registerTool', () => {
    it('should register a tool successfully', () => {
      const handler = jest.fn();

      server.registerTool({
        name: 'test_tool',
        description: 'A test tool',
        inputSchema: z.object({ input: z.string() }),
        auth: ['any'],
        handler,
      });

      expect(server.tools.has('test_tool')).toBe(true);
      expect(server.stats.callsByTool.test_tool).toBeDefined();
    });

    it('should throw error if name or handler missing', () => {
      expect(() => {
        server.registerTool({
          description: 'Tool without name',
        });
      }).toThrow('Tool must have name and handler');
    });
  });

  describe('getToolDefinitions', () => {
    it('should return all registered tools', () => {
      server.registerTool({
        name: 'tool1',
        description: 'Tool 1',
        handler: jest.fn(),
      });

      server.registerTool({
        name: 'tool2',
        description: 'Tool 2',
        handler: jest.fn(),
      });

      const definitions = server.getToolDefinitions();

      expect(definitions).toHaveLength(2);
      expect(definitions.map((d) => d.name)).toContain('tool1');
      expect(definitions.map((d) => d.name)).toContain('tool2');
    });

    it('should not return disabled tools', () => {
      server.registerTool({
        name: 'enabled_tool',
        handler: jest.fn(),
      });

      server.registerTool({
        name: 'disabled_tool',
        handler: jest.fn(),
      });

      server.tools.get('disabled_tool').enabled = false;

      const definitions = server.getToolDefinitions();

      expect(definitions).toHaveLength(1);
      expect(definitions[0].name).toBe('enabled_tool');
    });
  });

  describe('validateInput', () => {
    it('should validate input successfully', async () => {
      const schema = z.object({
        name: z.string(),
        age: z.number(),
      });

      const input = { name: 'John', age: 30 };
      const validated = await server.validateInput(schema, input);

      expect(validated).toEqual(input);
    });

    it('should throw validation error for invalid input', async () => {
      const schema = z.object({
        name: z.string(),
        age: z.number(),
      });

      const input = { name: 'John', age: 'thirty' }; // Invalid age

      await expect(server.validateInput(schema, input)).rejects.toThrow('Validation error');
    });
  });

  describe('updateStats', () => {
    it('should update stats for successful call', () => {
      server.registerTool({
        name: 'test_tool',
        handler: jest.fn(),
      });

      server.updateStats('test_tool', true, 100);

      expect(server.stats.totalCalls).toBe(1);
      expect(server.stats.successfulCalls).toBe(1);
      expect(server.stats.failedCalls).toBe(0);
      expect(server.stats.callsByTool.test_tool.successful).toBe(1);
    });

    it('should update stats for failed call', () => {
      server.registerTool({
        name: 'test_tool',
        handler: jest.fn(),
      });

      server.updateStats('test_tool', false, 200);

      expect(server.stats.totalCalls).toBe(1);
      expect(server.stats.successfulCalls).toBe(0);
      expect(server.stats.failedCalls).toBe(1);
      expect(server.stats.callsByTool.test_tool.failed).toBe(1);
    });
  });

  describe('getStats', () => {
    it('should return server statistics', () => {
      server.registerTool({
        name: 'tool1',
        handler: jest.fn(),
      });

      server.updateStats('tool1', true, 100);
      server.updateStats('tool1', true, 200);
      server.updateStats('tool1', false, 150);

      const stats = server.getStats();

      expect(stats.server).toBe('test-server');
      expect(stats.tools).toBe(1);
      expect(stats.stats.totalCalls).toBe(3);
      expect(stats.stats.successfulCalls).toBe(2);
      expect(stats.stats.failedCalls).toBe(1);
      expect(stats.stats.successRate).toBe(67); // 2/3 = 66.67% rounded
    });
  });
});
