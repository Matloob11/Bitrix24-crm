/**
 * @module stafftrack/check-in-v2/enums/src/check-in-type
 */
jn.define('stafftrack/check-in-v2/enums/src/check-in-type', (require, exports, module) => {
	const { BaseEnum } = require('utils/enums/base');

	/**
	 * @class CheckInTypeEnum
	 */
	class CheckInTypeEnum extends BaseEnum
	{
		static MANUAL = new CheckInTypeEnum('MANUAL', 1);
		static AUTOMATIC = new CheckInTypeEnum('AUTOMATIC', 2);

		static isManual(type)
		{
			return type === this.MANUAL.getValue();
		}
	}

	module.exports = { CheckInTypeEnum };
});
