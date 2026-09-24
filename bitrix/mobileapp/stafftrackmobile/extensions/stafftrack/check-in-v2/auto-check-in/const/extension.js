/**
 * @module stafftrack/check-in-v2/auto-check-in/const
 */
jn.define('stafftrack/check-in-v2/auto-check-in/const', (require, exports, module) => {
	const SHARED_STORAGE_KEY = `auto-check-in_${currentDomain}_${env.userId}`;

	module.exports = { SHARED_STORAGE_KEY };
});
