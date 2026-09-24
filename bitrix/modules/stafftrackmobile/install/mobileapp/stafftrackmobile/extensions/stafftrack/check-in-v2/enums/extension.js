/**
 * @module stafftrack/check-in-v2/enums
 */
jn.define('stafftrack/check-in-v2/enums', (require, exports, module) => {
	const { CheckInTypeEnum } = require('stafftrack/check-in-v2/enums/src/check-in-type');
	const { PullCommand } = require('stafftrack/check-in-v2/enums/src/pull-command');

	module.exports = {
		CheckInTypeEnum,
		PullCommand,
	};
});
