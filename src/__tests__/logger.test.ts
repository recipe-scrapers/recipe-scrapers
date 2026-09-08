import { afterEach, beforeEach, describe, expect, it, spyOn } from 'bun:test'

import { Logger, LogLevel } from '../logger'

describe('Logger', () => {
  let consoleSpy: {
    log: ReturnType<typeof spyOn>
    debug: ReturnType<typeof spyOn>
    info: ReturnType<typeof spyOn>
    warn: ReturnType<typeof spyOn>
    error: ReturnType<typeof spyOn>
  }

  beforeEach(() => {
    consoleSpy = {
      log: spyOn(console, 'log').mockImplementation(() => {}),
      debug: spyOn(console, 'debug').mockImplementation(() => {}),
      info: spyOn(console, 'info').mockImplementation(() => {}),
      warn: spyOn(console, 'warn').mockImplementation(() => {}),
      error: spyOn(console, 'error').mockImplementation(() => {}),
    }
  })

  afterEach(() => {
    consoleSpy.log.mockRestore()
    consoleSpy.debug.mockRestore()
    consoleSpy.info.mockRestore()
    consoleSpy.warn.mockRestore()
    consoleSpy.error.mockRestore()
  })

  describe('constructor', () => {
    it('should create logger with default log level WARN', () => {
      const logger = new Logger('TestContext')

      logger.verbose('test')
      logger.debug('test')
      logger.info('test')
      logger.log('test')
      logger.warn('test')

      expect(consoleSpy.log).not.toHaveBeenCalled()
      expect(consoleSpy.debug).not.toHaveBeenCalled()
      expect(consoleSpy.info).not.toHaveBeenCalled()
      expect(consoleSpy.warn).toHaveBeenCalledWith(
        '[WARN][TestContext]',
        'test',
      )
    })

    it('should create logger with custom log level', () => {
      const logger = new Logger('TestContext', LogLevel.DEBUG)

      logger.verbose('test')
      logger.debug('test')

      expect(consoleSpy.log).not.toHaveBeenCalled()
      expect(consoleSpy.debug).toHaveBeenCalledWith(
        '[DEBUG][TestContext]',
        'test',
      )
    })
  })

  describe('verbose', () => {
    it('should log when log level is VERBOSE', () => {
      const logger = new Logger('TestContext', LogLevel.VERBOSE)

      logger.verbose('verbose message', { data: 'test' })

      expect(consoleSpy.log).toHaveBeenCalledWith(
        '[VERBOSE][TestContext]',
        'verbose message',
        { data: 'test' },
      )
    })

    it('should not log when log level is higher than VERBOSE', () => {
      const logger = new Logger('TestContext', LogLevel.DEBUG)

      logger.verbose('verbose message')

      expect(consoleSpy.log).not.toHaveBeenCalled()
    })
  })

  describe('debug', () => {
    it('should log when log level is DEBUG or lower', () => {
      const logger = new Logger('TestContext', LogLevel.DEBUG)

      logger.debug('debug message', 123)

      expect(consoleSpy.debug).toHaveBeenCalledWith(
        '[DEBUG][TestContext]',
        'debug message',
        123,
      )
    })

    it('should not log when log level is higher than DEBUG', () => {
      const logger = new Logger('TestContext', LogLevel.INFO)

      logger.debug('debug message')

      expect(consoleSpy.debug).not.toHaveBeenCalled()
    })
  })

  describe('log', () => {
    it('should log when log level is INFO or lower', () => {
      const logger = new Logger('TestContext', LogLevel.INFO)

      logger.log('info message')

      expect(consoleSpy.log).toHaveBeenCalledWith(
        '[INFO][TestContext]',
        'info message',
      )
    })

    it('should not log when log level is higher than INFO', () => {
      const logger = new Logger('TestContext', LogLevel.WARN)

      logger.log('info message')

      expect(consoleSpy.log).not.toHaveBeenCalled()
    })
  })

  describe('info', () => {
    it('should log when log level is INFO or lower', () => {
      const logger = new Logger('TestContext', LogLevel.INFO)

      logger.info('info message', true)

      expect(consoleSpy.info).toHaveBeenCalledWith(
        '[INFO][TestContext]',
        'info message',
        true,
      )
    })

    it('should not log when log level is higher than INFO', () => {
      const logger = new Logger('TestContext', LogLevel.WARN)

      logger.info('info message')

      expect(consoleSpy.info).not.toHaveBeenCalled()
    })
  })

  describe('warn', () => {
    it('should log when log level is WARN or lower', () => {
      const logger = new Logger('TestContext', LogLevel.WARN)

      logger.warn('warning message', 'extra data')

      expect(consoleSpy.warn).toHaveBeenCalledWith(
        '[WARN][TestContext]',
        'warning message',
        'extra data',
      )
    })

    it('should not log when log level is higher than WARN', () => {
      const logger = new Logger('TestContext', LogLevel.ERROR)

      logger.warn('warning message')

      expect(consoleSpy.warn).not.toHaveBeenCalled()
    })
  })

  describe('error', () => {
    it('should always log errors regardless of log level', () => {
      const logger = new Logger('TestContext', LogLevel.ERROR)

      logger.error('error message', new Error('test error'))

      expect(consoleSpy.error).toHaveBeenCalledWith(
        '[ERROR][TestContext]',
        'error message',
        new Error('test error'),
      )
    })

    it('should log errors even with highest log level', () => {
      const logger = new Logger('TestContext', 999 as LogLevel)

      logger.error('critical error')

      expect(consoleSpy.error).toHaveBeenCalledWith(
        '[ERROR][TestContext]',
        'critical error',
      )
    })
  })

  describe('log level filtering', () => {
    it('should respect VERBOSE log level', () => {
      const logger = new Logger('TestContext', LogLevel.VERBOSE)

      logger.verbose('verbose')
      logger.debug('debug')
      logger.info('info')
      logger.warn('warn')
      logger.error('error')

      expect(consoleSpy.log).toHaveBeenCalledWith(
        '[VERBOSE][TestContext]',
        'verbose',
      )
      expect(consoleSpy.debug).toHaveBeenCalledWith(
        '[DEBUG][TestContext]',
        'debug',
      )
      expect(consoleSpy.info).toHaveBeenCalledWith(
        '[INFO][TestContext]',
        'info',
      )
      expect(consoleSpy.warn).toHaveBeenCalledWith(
        '[WARN][TestContext]',
        'warn',
      )
      expect(consoleSpy.error).toHaveBeenCalledWith(
        '[ERROR][TestContext]',
        'error',
      )
    })

    it('should respect ERROR log level', () => {
      const logger = new Logger('TestContext', LogLevel.ERROR)

      logger.verbose('verbose')
      logger.debug('debug')
      logger.info('info')
      logger.warn('warn')
      logger.error('error')

      expect(consoleSpy.log).not.toHaveBeenCalled()
      expect(consoleSpy.debug).not.toHaveBeenCalled()
      expect(consoleSpy.info).not.toHaveBeenCalled()
      expect(consoleSpy.warn).not.toHaveBeenCalled()
      expect(consoleSpy.error).toHaveBeenCalledWith(
        '[ERROR][TestContext]',
        'error',
      )
    })
  })

  describe('context formatting', () => {
    it('should include context in all log messages', () => {
      const logger = new Logger('RecipeScraper', LogLevel.VERBOSE)

      logger.verbose('test')
      logger.debug('test')
      logger.info('test')
      logger.warn('test')
      logger.error('test')

      expect(consoleSpy.log).toHaveBeenCalledWith(
        '[VERBOSE][RecipeScraper]',
        'test',
      )
      expect(consoleSpy.debug).toHaveBeenCalledWith(
        '[DEBUG][RecipeScraper]',
        'test',
      )
      expect(consoleSpy.info).toHaveBeenCalledWith(
        '[INFO][RecipeScraper]',
        'test',
      )
      expect(consoleSpy.warn).toHaveBeenCalledWith(
        '[WARN][RecipeScraper]',
        'test',
      )
      expect(consoleSpy.error).toHaveBeenCalledWith(
        '[ERROR][RecipeScraper]',
        'test',
      )
    })
  })

  describe('multiple arguments', () => {
    it('should handle multiple arguments correctly', () => {
      const logger = new Logger('TestContext', LogLevel.VERBOSE)
      const obj = { key: 'value' }
      const arr = [1, 2, 3]

      logger.verbose('message', obj, arr, 42, true)

      expect(consoleSpy.log).toHaveBeenCalledWith(
        '[VERBOSE][TestContext]',
        'message',
        obj,
        arr,
        42,
        true,
      )
    })
  })
})

describe('LogLevel enum', () => {
  it('should have correct numeric values', () => {
    expect(LogLevel.VERBOSE).toBe(0)
    expect(LogLevel.DEBUG).toBe(1)
    expect(LogLevel.INFO).toBe(2)
    expect(LogLevel.WARN).toBe(3)
    expect(LogLevel.ERROR).toBe(4)
  })

  it('should maintain proper ordering', () => {
    expect(LogLevel.VERBOSE < LogLevel.DEBUG).toBe(true)
    expect(LogLevel.DEBUG < LogLevel.INFO).toBe(true)
    expect(LogLevel.INFO < LogLevel.WARN).toBe(true)
    expect(LogLevel.WARN < LogLevel.ERROR).toBe(true)
  })
})
