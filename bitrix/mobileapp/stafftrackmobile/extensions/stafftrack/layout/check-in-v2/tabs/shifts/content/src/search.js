/**
 * @module stafftrack/layout/check-in-v2/tabs/shifts/content/src/search
 */
jn.define('stafftrack/layout/check-in-v2/tabs/shifts/content/src/search', (require, exports, module) => {
	const { SearchLayout } = require('layout/ui/search-bar');
	const { Loc } = require('loc');
	const { PropTypes } = require('utils/validation');

	const PresetId = {
		MY_DEPARTMENT: 'my_department',
		EMPLOYEES_DEPARTMENTS: 'employees_departments',
	};
	const MIN_SEARCH_LENGTH = 3;

	class Search
	{
		#onShow = null;
		#onHide = null;
		#onSearch = null;
		#onCancel = null;

		/**
		 * @param {Object} props
		 * @param {PageManager} props.layout
		 * @param {function} props.onShow
		 * @param {function} props.onHide
		 * @param {function} props.onSearch
		 * @param {function} props.onCancel
		 */
		constructor(props)
		{
			PropTypes.validate(Search.propTypes, props, 'Search');

			this.#onShow = props.onShow;
			this.#onHide = props.onHide;
			this.#onSearch = props.onSearch;
			this.#onCancel = props.onCancel;

			this.searchText = '';
			this.searchLayout = new SearchLayout({
				id: 'stafftrack_check_in_map_search',
				layout: props.layout,
				presets: [
					{
						id: PresetId.MY_DEPARTMENT,
						name: Loc.getMessage('M_STAFFTRACK_CHECK_IN_SEARCH_PRESET_DEPARTMENT'),
						default: true,
					},
					{
						id: PresetId.EMPLOYEES_DEPARTMENTS,
						name: Loc.getMessage('M_STAFFTRACK_CHECK_IN_SEARCH_PRESET_EMPLOYEES'),
						default: false,
						disabled: true,
						badgeComingSoon: true,
					},
				],
				presetId: PresetId.MY_DEPARTMENT,
				isActivePresetRequired: true,
				onShow: this.#handleShow.bind(this),
				onHide: this.#handleHide.bind(this),
				onSearch: this.#handleSearch.bind(this),
				onCancel: this.#handleCancel.bind(this),
			});

			this.wasActive = false;
		}

		getSearchButton()
		{
			return this.searchLayout?.getSearchButton() ?? null;
		}

		close()
		{
			this.searchLayout?.close();
		}

		isActive()
		{
			return this.searchText.length >= MIN_SEARCH_LENGTH;
		}

		matchesEmployee(employee)
		{
			if (!this.isActive())
			{
				return true;
			}

			const { name, firstName, lastName, secondName } = employee;
			const haystack = [name, firstName, lastName, secondName].filter(Boolean).join(' ').toLowerCase();

			return (
				this.searchText
					.toLowerCase()
					.split(/\s+/)
					.filter(Boolean)
					.every((token) => haystack.includes(token))
			);
		}

		#handleShow()
		{
			this.#onShow?.();
		}

		#handleHide()
		{
			this.#onHide?.();
		}

		#handleSearch({ text })
		{
			this.searchText = (text || '').trim();

			if (this.isActive())
			{
				this.wasActive = true;
				this.#onSearch?.();
			}
			else if (this.wasActive)
			{
				this.wasActive = false;
				this.#onCancel?.();
			}
		}

		#handleCancel()
		{
			this.searchText = '';

			if (this.wasActive)
			{
				this.wasActive = false;
				this.#onCancel?.();
			}
		}
	}

	Search.propTypes = {
		layout: PropTypes.object.isRequired,
		onSearch: PropTypes.func.isRequired,
		onCancel: PropTypes.func.isRequired,
		onShow: PropTypes.func.isRequired,
		onHide: PropTypes.func.isRequired,
	};

	module.exports = { Search };
});
