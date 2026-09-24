/**
 * @module stafftrack/statemanager/redux/slices/check-in/thunk
 */
jn.define('stafftrack/statemanager/redux/slices/check-in/thunk', (require, exports, module) => {
	const { createAsyncThunk } = require('statemanager/redux/toolkit');
	const { RunActionExecutor } = require('rest/run-action-executor');
	const { sliceName } = require('stafftrack/statemanager/redux/slices/check-in/meta');

	const generateTempId = () => `temp_${Date.now()}_${Math.random().toString(36).slice(2)}`;

	const callAddCheckIn = ({ uploadedFiles = [], ...checkInDto }) => new Promise((resolve) => {
		void new RunActionExecutor('stafftrackmobile.v2.CheckIn.add', { checkInDto, uploadedFiles })
			.setHandler((response) => resolve(response?.status === 'success' ? response.data : null))
			.call()
		;
	});

	const create = createAsyncThunk(
		`${sliceName}/create`,
		async ({ files, uploadedFiles = [], ...checkInDto }, { rejectWithValue }) => {
			const response = await callAddCheckIn({ uploadedFiles, ...checkInDto });

			if (!response)
			{
				return rejectWithValue('add-failed');
			}

			return response;
		},
		{ idGenerator: () => generateTempId() },
	);

	module.exports = { create };
});
