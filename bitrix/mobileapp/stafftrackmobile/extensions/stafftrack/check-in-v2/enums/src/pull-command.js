/**
 * @module stafftrack/check-in-v2/enums/src/pull-command
 */
jn.define('stafftrack/check-in-v2/enums/src/pull-command', (require, exports, module) => {
	const { BaseEnum } = require('utils/enums/base');

	/**
	 * @class PullCommand
	 */
	class PullCommand extends BaseEnum
	{
		static CHECK_IN_ADD = new PullCommand('CHECK_IN_ADD', 'check_in_add');
		static CHECK_IN_ADDRESS_RESOLVED = new PullCommand('CHECK_IN_ADDRESS_RESOLVED', 'check_in_address_resolved');
	}

	module.exports = {
		PullCommand,
	};
});
