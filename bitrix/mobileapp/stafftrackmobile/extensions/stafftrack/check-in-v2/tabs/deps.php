<?php

return [
	'extensions' => [
		'require-lazy',
		'type',
		'utils/type',
		'stafftrack:layout/check-in-v2/tabs/shifts/stub', // @keep
		'stafftrack:layout/check-in-v2/tabs/work-reports/stub', // @keep
		'stafftrack:layout/check-in-v2/tabs/work-days/stub', // @keep
	],
	'bundle' => [
		'./src/tab-id',
	],
];
