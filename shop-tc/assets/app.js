(function () {
	const form = document.getElementById('sc-form');
	const status = document.getElementById('sc-status');
	const cardsHost = document.getElementById('sc-cards');
	const countEl = document.getElementById('sc-count');
	if (!form || !cardsHost) return;

	let moneySource = '';
	let searchTimer = 0;
	let openDd = null;
	let boardItems = [];
	let filterPeriod = 'all';
	let filterResult = '';
	const meBase = window.SC_ME || {
		roles: [], writable: [], checks: [], uploads: [], sections: {},
		canCreate: false, canAddAgent: false, canSignReviewer: false, canSignMalik: false, canLockCommission: false,
	};
	window.SC_ME = meBase;

	function roleState() {
		return window.SC_ME || meBase;
	}

	function canField(name) {
		const me = roleState();
		if ((me.writable || []).indexOf(name) !== -1) return true;
		const tick = /^check(\d+)$/.exec(name);
		if (tick) return (me.checks || []).indexOf(parseInt(tick[1], 10)) !== -1;
		const up = /^check(\d+)(Evidence|FileId|FileName)$/.exec(name);
		if (up) return (me.uploads || []).indexOf(parseInt(up[1], 10)) !== -1;
		if (name === 'id') return true;
		if (name === 'propertySearch') return (me.writable || []).indexOf('community') !== -1;
		return false;
	}

	function setCardPerms(perms) {
		window.SC_ME = perms || meBase;
		applyLocks();
	}

	function applyLocks() {
		const me = roleState();
		form.querySelectorAll('[data-section]').forEach(function (sec) {
			const key = String(sec.getAttribute('data-section') || '');
			const spec = me.sections && me.sections[key];
			const can = !!(spec && spec.can);
			sec.classList.toggle('is-locked', !can);
			const who = sec.querySelector('.sc-who');
			if (who && spec) {
				who.classList.toggle('is-you', can);
				who.textContent = (spec.whoLabel || '') + (can ? ' — you can edit this' : ' — locked for your role');
			}
		});
		form.querySelectorAll('input, textarea, select').forEach(function (el) {
			if (!el.name || el.type === 'hidden' || el.type === 'file') return;
			if (el.readOnly && (el.name === 'vatAmount' || el.name === 'grossCommission' || el.name === 'companyShareAed' || el.name === 'agentShareAed' || el.name === 'agentCount' || el.name === 'passedCount' || el.name === 'failedCount' || el.name === 'naCount' || /Amount$/.test(el.name))) {
				return;
			}
			const allow = canField(el.name);
			el.disabled = !allow;
		});
		form.querySelectorAll('[data-choice]').forEach(function (host) {
			const name = host.getAttribute('data-choice');
			host.classList.toggle('is-locked', !canField(name));
		});
		for (let n = 1; n <= 14; n++) {
			const row = form.querySelector('[data-check="' + n + '"]');
			if (!row) continue;
			const canTick = (me.checks || []).indexOf(n) !== -1;
			const canUp = (me.uploads || []).indexOf(n) !== -1;
			row.classList.toggle('is-tick-locked', !canTick);
			row.classList.toggle('is-up-locked', !canUp);
			row.querySelectorAll('input[type="radio"]').forEach(function (r) { r.disabled = !canTick; });
			const file = row.querySelector('input[type="file"]');
			if (file) file.disabled = !canUp;
		}
		const addBtn = document.getElementById('sc-add-agent');
		if (addBtn) addBtn.hidden = !me.canAddAgent;
		const newBtn = document.getElementById('sc-new');
		if (newBtn) newBtn.hidden = !me.canCreate;
		const lockBtn = document.getElementById('sc-lock-commission');
		if (lockBtn) lockBtn.hidden = !me.canLockCommission;
		const locked = String(field('commissionLocked') && field('commissionLocked').value || '') === 'yes';
		if (locked && !me.canLockCommission) {
			['totalCommission', 'vatPercent', 'companySharePct', 'agentSharePct'].forEach(function (name) {
				const el = field(name);
				if (el) el.disabled = true;
			});
		}
	}

	function setStatus(type, text) {
		status.hidden = !text;
		status.className = 'sc-status ' + (type || '');
		status.textContent = text || '';
	}

	function field(name) {
		return form.querySelector('[name="' + name + '"]');
	}

	function inferWhen(map) {
		if (!map.clientType) {
			if (map.companyName || map.tradeLicence || map.signatoryName) map.clientType = 'company';
			else if (map.eidNumber || map.passportNumber || map.clientName) map.clientType = 'individual';
		}
		if (!map.dealType) {
			if (map.ejariNo) map.dealType = 'Rental';
			else if (map.spaNo) map.dealType = 'Off-plan';
			else if (map.titleDeed) map.dealType = 'Resale';
		}
		if (map.dealType === 'Off-plan' && !map.spaNo && map.titleDeed) map.spaNo = map.titleDeed;
		if (map.propertyType) {
			const p = String(map.propertyType).toLowerCase();
			if (p.indexOf('apart') !== -1) map.propertyType = 'Apartment';
			else if (p.indexOf('villa') !== -1) map.propertyType = 'Villa';
			else if (p.indexOf('shop') !== -1 || p.indexOf('retail') !== -1) map.propertyType = 'Shop';
			else if (p.indexOf('land') !== -1 || p.indexOf('plot') !== -1) map.propertyType = 'Land';
		}
		return map;
	}

	function whenValues() {
		return {
			clientType: String(field('clientType') && field('clientType').value || ''),
			dealType: String(field('dealType') && field('dealType').value || ''),
			propertyType: String(field('propertyType') && field('propertyType').value || ''),
			result: String(field('result') && field('result').value || ''),
		};
	}

	function whenMatch(spec, values) {
		const colon = spec.indexOf(':');
		if (colon < 0) return true;
		const key = spec.slice(0, colon);
		const allowed = spec.slice(colon + 1).split(',');
		return allowed.indexOf(String(values[key] || '')) !== -1;
	}

	function syncWhen() {
		const values = whenValues();
		form.querySelectorAll('[data-when]').forEach(function (el) {
			const spec = String(el.getAttribute('data-when') || '');
			el.hidden = !spec.split(';').every(function (part) {
				return whenMatch(part.trim(), values);
			});
		});
	}

	function choiceInput(host) {
		const name = host && host.getAttribute('data-choice');
		return name ? host.querySelector('[name="' + name + '"]') : null;
	}

	function paintChoice(name) {
		const host = form.querySelector('[data-choice="' + name + '"]');
		if (!host) return;
		const input = choiceInput(host);
		const val = String(input && input.value || '');
		host.querySelectorAll('[data-choice-val]').forEach(function (btn) {
			btn.classList.toggle('is-on', val !== '' && btn.getAttribute('data-choice-val') === val);
		});
	}

	function paintAllChoices() {
		form.querySelectorAll('[data-choice]').forEach(function (host) {
			paintChoice(host.getAttribute('data-choice'));
		});
	}

	function fill(map) {
		map = inferWhen(Object.assign({}, map));
		ensureAgentRows(Math.max(agentCount(), neededAgents(map)));
		Object.keys(map).forEach(function (key) {
			if (key.indexOf('check') === 0 && /^check\d+$/.test(key)) {
				const radios = form.querySelectorAll('[name="' + key + '"]');
				radios.forEach(function (r) {
					r.checked = r.value === map[key];
				});
				return;
			}
			const el = field(key);
			if (el && map[key] !== undefined && map[key] !== null) {
				el.value = String(map[key]);
			}
		});
		syncAgentCount();
		syncMoney('fill');
		syncChecks();
		paintEvidence();
		paintAllChoices();
		paintResult();
		form.querySelectorAll('.sc-check-row.is-open').forEach(function (row) { row.classList.remove('is-open'); });
		syncWhen();
		applyLocks();
	}

	function moneyNumber(value) {
		const n = parseFloat(String(value || '').replace(/,/g, '').replace(/[^\d.-]/g, ''));
		return isNaN(n) ? 0 : n;
	}

	function moneyText(n) {
		if (!n && n !== 0) return '';
		const rounded = Math.round(n * 100) / 100;
		if (!rounded && n !== 0) return '';
		return rounded.toFixed(2).replace(/\.00$/, '');
	}

	function clampPct(n) {
		if (n < 0) return 0;
		if (n > 100) return 100;
		return n;
	}

	function agentHost() {
		return document.getElementById('sc-agents');
	}

	function agentRows() {
		return agentHost() ? agentHost().querySelectorAll('[data-agent]') : [];
	}

	function agentCount() {
		return Math.max(1, agentRows().length);
	}

	function neededAgents(map) {
		let max = 1;
		Object.keys(map || {}).forEach(function (key) {
			const m = /^agent(\d+)/.exec(key);
			if (!m) return;
			const n = parseInt(m[1], 10);
			const val = String(map[key] || '').trim();
			if (val) max = Math.max(max, n);
		});
		const declared = parseInt(map && map.agentCount, 10);
		if (!isNaN(declared)) max = Math.max(max, declared);
		return Math.min(20, Math.max(1, max));
	}

	function choiceHtml(name, label, options, wide) {
		const buttons = options.map(function (opt) {
			return '<button type="button" data-choice-val="' + opt + '">' + opt + '</button>';
		}).join('');
		return '<div class="sc-choice' + (wide ? ' sc-wide' : '') + '" data-choice="' + name + '">'
			+ '<span class="sc-choice-label">' + label + '</span>'
			+ '<input type="hidden" name="' + name + '">'
			+ '<div class="sc-choice-btns">' + buttons + '</div>'
			+ '</div>';
	}

	function agentRowHtml(n) {
		const remove = n > 1
			? '<button type="button" class="ui-btn ui-btn-sm" data-remove-agent>Remove</button>'
			: '';
		return '<div class="sc-agent-row" data-agent="' + n + '">'
			+ '<div class="sc-agent-head"><span class="sc-agent-num">Agent ' + n + '</span>' + remove + '</div>'
			+ '<div class="sc-agent-grid">'
			+ '<label class="sc-pick">Agent name <input name="agent' + n + 'Name" data-crm="user" placeholder="Click to pick a Bitrix user" autocomplete="off"></label>'
			+ '<label>Employee ID <input name="agent' + n + 'EmpId"></label>'
			+ choiceHtml('agent' + n + 'Office', 'Office', ['Dubai', 'Pakistan'])
			+ choiceHtml('agent' + n + 'Role', 'Role', ['Sourcing', 'Closing', 'Listing', 'Referral'], true)
			+ '<label>Contact no. (company) <input name="agent' + n + 'Contact"></label>'
			+ '<label>Split % <input name="agent' + n + 'Split" data-money="agentSplit" inputmode="decimal"></label>'
			+ '<label>Amount (AED) <input name="agent' + n + 'Amount" data-money="agentAmount" inputmode="decimal"></label>'
			+ '</div></div>';
	}

	function addAgentRow() {
		if (!roleState().canAddAgent) {
			setStatus('err', 'Only a sales manager or team leader can add agents on the split.');
			return;
		}
		if (agentCount() >= 20) {
			setStatus('warn', 'Maximum 20 agents on one deal file.');
			return;
		}
		const n = agentCount() + 1;
		agentHost().insertAdjacentHTML('beforeend', agentRowHtml(n));
		syncAgentCount();
		const name = field('agent' + n + 'Name');
		if (name) name.focus();
	}

	function removeAgentRow(row) {
		if (agentCount() <= 1) return;
		row.remove();
		reindexAgents();
		syncAgentCount();
		syncMoney('agentSplit');
	}

	function reindexAgents() {
		const rows = agentRows();
		rows.forEach(function (row, idx) {
			const n = idx + 1;
			const old = row.getAttribute('data-agent');
			row.setAttribute('data-agent', String(n));
			const num = row.querySelector('.sc-agent-num');
			if (num) num.textContent = 'Agent ' + n;
			let head = row.querySelector('.sc-agent-head');
			if (!head) {
				head = document.createElement('div');
				head.className = 'sc-agent-head';
				row.insertBefore(head, row.firstChild);
			}
			let remove = row.querySelector('[data-remove-agent]');
			if (n > 1 && !remove) {
				head.insertAdjacentHTML('beforeend', '<button type="button" class="ui-btn ui-btn-sm" data-remove-agent>Remove</button>');
			}
			if (n === 1 && remove) remove.remove();
			row.querySelectorAll('[name]').forEach(function (el) {
				el.name = String(el.name || '').replace('agent' + old, 'agent' + n);
			});
			row.querySelectorAll('[data-choice]').forEach(function (host) {
				host.setAttribute('data-choice', String(host.getAttribute('data-choice') || '').replace('agent' + old, 'agent' + n));
			});
		});
	}

	function ensureAgentRows(count) {
		count = Math.min(20, Math.max(1, count));
		while (agentCount() < count) {
			agentHost().insertAdjacentHTML('beforeend', agentRowHtml(agentCount() + 1));
		}
		while (agentCount() > count) {
			const last = agentHost().querySelector('[data-agent]:last-child');
			if (last && agentCount() > 1) last.remove();
			else break;
		}
		reindexAgents();
		syncAgentCount();
	}

	function syncAgentCount() {
		if (field('agentCount')) field('agentCount').value = String(agentCount());
	}

	function syncAgents() {
		syncAgentCount();
	}

	function splitSum() {
		let sum = 0;
		const n = agentCount();
		for (let i = 1; i <= n; i++) {
			sum += moneyNumber(field('agent' + i + 'Split') && field('agent' + i + 'Split').value);
		}
		return sum;
	}

	function syncMoney(source) {
		const total = moneyNumber(field('totalCommission') && field('totalCommission').value);
		const vatPct = moneyNumber(field('vatPercent') && field('vatPercent').value);
		const n = agentCount();
		source = source || moneySource;

		if (source === 'companyPct') {
			const c = clampPct(moneyNumber(field('companySharePct') && field('companySharePct').value));
			if (field('companySharePct')) field('companySharePct').value = moneyText(c);
			if (field('agentSharePct')) field('agentSharePct').value = moneyText(100 - c);
			if (n === 1 && field('agent1Split')) field('agent1Split').value = moneyText(100 - c);
		} else if (source === 'agentPct') {
			const a = clampPct(moneyNumber(field('agentSharePct') && field('agentSharePct').value));
			if (field('agentSharePct')) field('agentSharePct').value = moneyText(a);
			if (field('companySharePct')) field('companySharePct').value = moneyText(100 - a);
			if (n === 1 && field('agent1Split')) field('agent1Split').value = moneyText(a);
		} else if (source === 'agentSplit') {
			const sum = clampPct(splitSum());
			if (field('agentSharePct')) field('agentSharePct').value = moneyText(sum);
			if (field('companySharePct')) field('companySharePct').value = moneyText(100 - sum);
		} else if (source === 'agentAmount' && total > 0) {
			for (let i = 1; i <= n; i++) {
				const amt = moneyNumber(field('agent' + i + 'Amount') && field('agent' + i + 'Amount').value);
				if (field('agent' + i + 'Split')) field('agent' + i + 'Split').value = moneyText((amt / total) * 100);
			}
			const sum = clampPct(splitSum());
			if (field('agentSharePct')) field('agentSharePct').value = moneyText(sum);
			if (field('companySharePct')) field('companySharePct').value = moneyText(100 - sum);
		} else if (n === 1 && field('agentSharePct') && field('agentSharePct').value !== '' && field('agent1Split') && field('agent1Split').value === '') {
			field('agent1Split').value = field('agentSharePct').value;
		}

		const companyPct = moneyNumber(field('companySharePct') && field('companySharePct').value);
		const agentPct = moneyNumber(field('agentSharePct') && field('agentSharePct').value);
		const vat = total * (vatPct / 100);
		const gross = total + vat;
		if (field('vatAmount')) field('vatAmount').value = moneyText(vat);
		if (field('grossCommission')) field('grossCommission').value = moneyText(gross);
		if (field('companyShareAed')) field('companyShareAed').value = moneyText(total * (companyPct / 100));
		if (field('agentShareAed')) field('agentShareAed').value = moneyText(total * (agentPct / 100));

		if (source !== 'agentAmount') {
			for (let i = 1; i <= n; i++) {
				const split = moneyNumber(field('agent' + i + 'Split') && field('agent' + i + 'Split').value);
				if (field('agent' + i + 'Amount')) {
					field('agent' + i + 'Amount').value = split ? moneyText(total * (split / 100)) : '';
				}
			}
		}
		paintSplitStatus();
	}

	function paintSplitStatus() {
		const el = document.getElementById('sc-split-status');
		if (!el) return;
		const total = moneyNumber(field('totalCommission') && field('totalCommission').value);
		const company = moneyNumber(field('companySharePct') && field('companySharePct').value);
		const agent = moneyNumber(field('agentSharePct') && field('agentSharePct').value);
		const split = splitSum();
		const okPct = Math.abs(company + agent - 100) <= 0.05;
		const okSplit = Math.abs(split - agent) <= 0.05;
		if (total <= 0 && company === 0 && agent === 0) {
			el.className = 'sc-split-status';
			el.textContent = 'VAT, gross, and AED shares calculate as you type. Company % + agent % must equal 100.';
			return;
		}
		el.className = 'sc-split-status' + (okPct && okSplit && total > 0 ? ' is-ok' : ' is-bad');
		el.textContent = 'Company ' + moneyText(company) + '% + agents ' + moneyText(agent) + '% = '
			+ moneyText(company + agent) + '% · Agent splits ' + moneyText(split) + '%'
			+ (okPct && okSplit ? ' — adds up.' : ' — company + agents must be 100, and agent splits must match the agent share.');
	}

	function syncChecks() {
		let p = 0;
		let f = 0;
		let na = 0;
		for (let n = 1; n <= 14; n++) {
			const picked = form.querySelector('[name="check' + n + '"]:checked');
			if (!picked) continue;
			if (picked.value === 'P') p++;
			else if (picked.value === 'F') f++;
			else if (picked.value === 'NA') na++;
		}
		if (field('passedCount')) field('passedCount').value = String(p);
		if (field('failedCount')) field('failedCount').value = String(f);
		if (field('naCount')) field('naCount').value = String(na);
		if (field('result')) {
			field('result').value = (p + f + na) === 14 ? (f > 0 ? 'fail' : 'pass') : '';
		}
		paintResult();
	}

	function paintResult() {
		const banner = document.getElementById('sc-result-banner');
		if (!banner) return;
		const val = String(field('result') && field('result').value || '');
		let open = 0;
		for (let n = 1; n <= 14; n++) {
			if (!form.querySelector('[name="check' + n + '"]:checked')) open++;
		}
		banner.className = 'sc-result-banner';
		if (open) {
			banner.classList.add('is-wait');
			banner.textContent = 'In review — ' + open + ' check' + (open === 1 ? '' : 's')
				+ ' still open. Result fills itself.';
		} else if (val === 'fail') {
			banner.classList.add('is-fail');
			banner.textContent = 'FAIL — on hold. One or more checks failed.';
		} else {
			banner.classList.add('is-pass');
			banner.textContent = 'PASS — ready to release. All 14 are P or N/A.';
		}
	}

	function almost(a, b) {
		return Math.abs(a - b) <= 0.05;
	}

	function markCheckGaps() {
		const me = roleState();
		for (let n = 1; n <= 14; n++) {
			const row = form.querySelector('[data-check="' + n + '"]');
			const mine = (me.checks || []).indexOf(n) !== -1;
			if (row) row.classList.toggle('is-open', mine && !form.querySelector('[name="check' + n + '"]:checked'));
		}
	}

	function validateDeal(data) {
		const me = roleState();
		const errors = [];
		if ((me.writable || []).indexOf('dealId') !== -1) {
			if (!String(data.dealId || '').trim()) errors.push('Deal ID is required.');
			if (!data.clientType) {
				errors.push('Pick Individual or Company.');
			} else if (data.clientType === 'individual' && !String(data.clientName || '').trim()) {
				errors.push('Add the client name.');
			} else if (data.clientType === 'company' && !String(data.companyName || data.clientName || '').trim()) {
				errors.push('Add the company name.');
			}
		}
		if (me.canAddAgent) {
			const total = moneyNumber(data.totalCommission);
			const company = moneyNumber(data.companySharePct);
			const agent = moneyNumber(data.agentSharePct);
			if (total > 0 && !almost(company + agent, 100)) {
				errors.push('Company % and agent % must add to 100. Now ' + moneyText(company) + ' + ' + moneyText(agent) + ' = ' + moneyText(company + agent) + '.');
			}
			const n = agentCount();
			let split = 0;
			let named = 0;
			for (let i = 1; i <= n; i++) {
				const name = String(data['agent' + i + 'Name'] || '').trim();
				const sp = moneyNumber(data['agent' + i + 'Split']);
				if (name) named++;
				if (name && sp <= 0) errors.push('Add a split % for ' + name + '.');
				split += sp;
			}
			if (agent > 0.05 && named === 0) errors.push('Name the agent(s) who get the agent share.');
			if (named && !almost(split, agent)) {
				errors.push('Agent split % must add to the agent share (' + moneyText(agent) + '%). Now ' + moneyText(split) + '%.');
			}
		}
		if (me.canSignReviewer) {
			const rn = String(data.reviewerName || '').trim();
			const rs = String(data.reviewerSign || '').trim();
			if ((rn || rs) && (!rn || !rs)) errors.push('Compliance signature needs both the reviewer name and signature.');
		}
		if (me.canSignMalik) {
			const cn = String(data.countersignName || '').trim();
			const cs = String(data.countersignSign || '').trim();
			if ((cn || cs) && (!cn || !cs)) errors.push('Malik countersign needs both the name and signature.');
		}
		if (data.result === 'fail' && canField('failReason') && !String(data.failReason || '').trim()) {
			errors.push('This file is on hold. Add the failed check # and reason.');
		}
		return errors;
	}

	function paintEvidence() {
		for (let n = 1; n <= 14; n++) {
			const type = String(field('check' + n + 'Evidence') && field('check' + n + 'Evidence').value || '').trim();
			const name = String(field('check' + n + 'FileName') && field('check' + n + 'FileName').value || '').trim();
			const typeEl = form.querySelector('[data-ev-type="' + n + '"]');
			const nameEl = form.querySelector('[data-ev-name="' + n + '"]');
			const known = { PDF: 1, JPG: 1, PNG: 1, WEBP: 1, DOC: 1, DOCX: 1 };
			if (typeEl) {
				typeEl.textContent = type;
				typeEl.hidden = !known[type];
			}
			if (nameEl) nameEl.textContent = name || (type ? type : 'No file yet');
		}
	}

	form.addEventListener('input', function (e) {
		const t = e.target;
		if (!t) return;
		if (t.name === 'agentCount') {
			syncAgentCount();
			syncMoney('agentCount');
			return;
		}
		if (t.hasAttribute('data-money')) {
			moneySource = t.getAttribute('data-money') || '';
			syncMoney(moneySource);
		}
		if (t.getAttribute('data-crm')) scheduleSearch(t);
	});
	form.addEventListener('change', function (e) {
		const t = e.target;
		if (!t) return;
		if (t.hasAttribute('data-money') || t.name === 'agentCount') {
			moneySource = t.getAttribute('data-money') || '';
			syncAgentCount();
			syncMoney(moneySource);
		}
		if (/^check\d+$/.test(t.name || '')) {
			syncChecks();
			syncWhen();
			const row = t.closest('[data-check]');
			if (row) row.classList.remove('is-open');
		}
		if (t.hasAttribute('data-when-source') || t.name === 'clientType' || t.name === 'dealType' || t.name === 'propertyType' || t.name === 'result') {
			syncWhen();
		}
	});

	function formData() {
		syncMoney();
		syncChecks();
		const data = {};
		new FormData(form).forEach(function (value, key) {
			if (value instanceof File) return;
			if (key === 'propertySearch') return;
			data[key] = value;
		});
		if (data.clientType === 'company' && data.companyName) data.clientName = data.companyName;
		if (data.dealType === 'Off-plan' && data.spaNo && !data.titleDeed) data.titleDeed = data.spaNo;
		return data;
	}

	async function api(body) {
		const res = await fetch('/shop-tc/api.php', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(body),
			credentials: 'same-origin',
		});
		return res.json();
	}

	function triggerDownload(url, name) {
		const a = document.createElement('a');
		a.href = url;
		a.download = name || 'deal-scouting.pdf';
		a.rel = 'noopener';
		document.body.appendChild(a);
		a.click();
		a.remove();
	}

	function esc(s) {
		return String(s || '').replace(/[&<>"]/g, function (c) {
			return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c];
		});
	}

	function currentId() {
		return String(field('id') && field('id').value || '').trim();
	}

	function closeDropdowns(except) {
		form.querySelectorAll('.sc-dd').forEach(function (dd) {
			if (dd !== except) dd.hidden = true;
		});
		openDd = except && !except.hidden ? except : null;
	}

	function dropdownFor(input) {
		const host = input.closest('.sc-pick') || input.parentElement;
		let dd = host.querySelector('.sc-dd');
		if (!dd) {
			dd = document.createElement('div');
			dd.className = 'sc-dd';
			dd.hidden = true;
			host.appendChild(dd);
		}
		return dd;
	}

	async function runSearch(input) {
		const kind = input.getAttribute('data-crm');
		if (!kind) return;
		const dd = dropdownFor(input);
		dd.hidden = false;
		dd.innerHTML = '<div class="sc-dd-wait">Loading Bitrix list…</div>';
		closeDropdowns(dd);
		try {
			const json = await api({ action: 'search', kind: kind, q: input.value || '' });
			if (!json.ok) {
				dd.innerHTML = '<div class="sc-dd-empty">' + esc(json.error || 'Could not load CRM.') + '</div>';
				return;
			}
			const items = json.items || [];
			if (!items.length) {
				dd.innerHTML = '<div class="sc-dd-empty">No matching Bitrix records. Type another name or ID.</div>';
				return;
			}
			dd.innerHTML = items.map(function (item) {
				return '<button type="button" data-pick-kind="' + esc(item.kind) + '" data-pick-id="' + esc(item.id) + '">'
					+ '<b>' + esc(item.title) + '</b><small>' + esc(item.subtitle) + '</small></button>';
			}).join('');
			dd.querySelectorAll('[data-pick-id]').forEach(function (btn) {
				btn.addEventListener('mousedown', function (e) {
					e.preventDefault();
					applyPick(input, btn.getAttribute('data-pick-kind'), btn.getAttribute('data-pick-id'));
				});
			});
		} catch (err) {
			dd.innerHTML = '<div class="sc-dd-empty">Network error loading CRM.</div>';
		}
	}

	function scheduleSearch(input) {
		clearTimeout(searchTimer);
		searchTimer = setTimeout(function () { runSearch(input); }, 220);
	}

	async function applyPick(input, kind, id) {
		closeDropdowns();
		if (input.name && !canField(input.name) && input.name !== 'propertySearch') {
			setStatus('err', 'Your role cannot change that field.');
			return;
		}
		try {
			const json = await api({ action: 'lookup', kind: kind, id: id, target: input.name || '' });
			if (!json.ok) {
				setStatus('err', json.error || 'Could not load that CRM record.');
				return;
			}
			fill(json.fields || {});
			if (input.name === 'propertySearch') input.value = '';
			setStatus('ok', 'Filled from Bitrix. Check the boxes, then save.');
		} catch (err) {
			setStatus('err', 'Network error loading CRM.');
		}
	}

	form.addEventListener('focusin', function (e) {
		const input = e.target && e.target.getAttribute && e.target.getAttribute('data-crm') ? e.target : null;
		if (input) runSearch(input);
	});

	document.addEventListener('mousedown', function (e) {
		if (openDd && !openDd.contains(e.target) && !(e.target && e.target.getAttribute && e.target.getAttribute('data-crm'))) {
			closeDropdowns();
		}
	});

	form.addEventListener('change', async function (e) {
		const fileInp = e.target && e.target.getAttribute && e.target.getAttribute('data-evidence') ? e.target : null;
		if (!fileInp || !fileInp.files || !fileInp.files[0]) return;
		const n = fileInp.getAttribute('data-evidence');
		const body = new FormData();
		body.append('action', 'upload');
		body.append('check', n);
		body.append('id', currentId());
		body.append('file', fileInp.files[0]);
		setStatus('warn', 'Uploading supporting document for check ' + n + '…');
		try {
			const res = await fetch('/shop-tc/api.php', { method: 'POST', body: body, credentials: 'same-origin' });
			const json = await res.json();
			if (!json.ok) {
				setStatus('err', json.error || 'Upload failed.');
				fileInp.value = '';
				return;
			}
			if (field('check' + n + 'Evidence')) field('check' + n + 'Evidence').value = json.type;
			if (field('check' + n + 'FileId')) field('check' + n + 'FileId').value = String(json.fileId || '');
			if (field('check' + n + 'FileName')) field('check' + n + 'FileName').value = json.fileName || '';
			paintEvidence();
			setStatus('ok', 'Check ' + n + ' evidence uploaded — PDF will show ' + json.type + '.');
		} catch (err) {
			setStatus('err', 'Upload failed.');
		}
	});

	function formatWhen(ts) {
		if (!ts) return '';
		return new Intl.DateTimeFormat('en-GB', {
			timeZone: 'Asia/Dubai',
			day: '2-digit',
			month: 'short',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
			hour12: false,
		}).format(new Date(Number(ts) * 1000));
	}

	function dubaiYearMonth(ts) {
		const d = new Date(Number(ts) * 1000);
		if (isNaN(d.getTime())) return null;
		const parts = new Intl.DateTimeFormat('en-GB', {
			timeZone: 'Asia/Dubai',
			year: 'numeric',
			month: 'numeric',
		}).formatToParts(d);
		const map = {};
		parts.forEach(function (p) { map[p.type] = p.value; });
		return { y: parseInt(map.year, 10), m: parseInt(map.month, 10) };
	}

	function inPeriod(ts, period) {
		if (period === 'all') return true;
		if (!ts) return false;
		const now = dubaiYearMonth(Date.now() / 1000);
		const item = dubaiYearMonth(ts);
		if (!now || !item) return false;
		if (period === 'this-month') return item.y === now.y && item.m === now.m;
		if (period === 'last-month') {
			let m = now.m - 1;
			let y = now.y;
			if (m < 1) {
				m = 12;
				y -= 1;
			}
			return item.y === y && item.m === m;
		}
		if (period === 'this-year') return item.y === now.y;
		return true;
	}

	function paintBoardFilters() {
		document.querySelectorAll('[data-filter-period]').forEach(function (btn) {
			btn.classList.toggle('is-on', btn.getAttribute('data-filter-period') === filterPeriod);
		});
		document.querySelectorAll('[data-filter-result]').forEach(function (btn) {
			btn.classList.toggle('is-on', (btn.getAttribute('data-filter-result') || '') === filterResult);
		});
	}

	function applyBoardFilters() {
		const agentQ = String((document.getElementById('sc-filter-agent') || {}).value || '').trim().toLowerCase();
		const filtered = boardItems.filter(function (item) {
			if (filterResult === 'await') {
				if (item.result === 'pass' || item.result === 'fail' || item.status === 'pass' || item.status === 'fail') return false;
			} else if (filterResult && item.result !== filterResult && item.status !== filterResult) {
				return false;
			}
			if (agentQ && String(item.agentNames || '').toLowerCase().indexOf(agentQ) === -1) return false;
			if (!inPeriod(item.createdAt || item.updatedAt, filterPeriod)) return false;
			return true;
		});
		renderCards(filtered, boardItems.length);
	}

	function renderCards(items, total) {
		const id = currentId();
		const all = total == null ? items.length : total;
		countEl.textContent = all !== items.length ? items.length + '/' + all : String(items.length);
		if (!items.length) {
			cardsHost.innerHTML = '<div class="sc-empty">'
				+ (all ? 'No deal files match these filters.' : 'No deal files yet. Save the form and the card stays here.')
				+ '</div>';
			return;
		}
		cardsHost.innerHTML = items.map(function (item) {
			const on = item.id === id ? ' is-on' : '';
			const result = item.statusLabel || (item.result === 'pass' ? 'PASS — ready' : (item.result === 'fail' ? 'FAIL — on hold' : 'In review'));
			const when = item.savedLabel || formatWhen(item.createdAt);
			const updated = item.updatedLabel && item.updatedAt && item.createdAt && item.updatedAt !== item.createdAt
				? ' · Updated ' + item.updatedLabel
				: '';
			return '<article class="sc-card' + on + '" data-card="' + esc(item.id) + '">'
				+ (when ? '<p class="sc-card-when">Saved ' + esc(when) + esc(updated) + '</p>' : '')
				+ '<h3>' + esc(item.title) + '</h3>'
				+ (item.tenantName ? '<p>Client: ' + esc(item.tenantName) + '</p>' : '')
				+ (item.dateTo ? '<p>Type: ' + esc(item.dateTo) + '</p>' : '')
				+ (item.agentNames ? '<p>Agents: ' + esc(item.agentNames) + '</p>' : '')
				+ (item.propertyNo ? '<p>Ref: ' + esc(item.propertyNo) + '</p>' : '')
				+ '<p>Result: ' + esc(result) + '</p>'
				+ '<div class="sc-card-actions">'
				+ '<button type="button" class="ui-btn ui-btn-sm ui-btn-primary" data-edit="' + esc(item.id) + '">Edit</button>'
				+ '<button type="button" class="ui-btn ui-btn-sm" data-card-download="' + esc(item.id) + '" data-name="' + esc(item.pdfName || 'deal-scouting.pdf') + '">Download</button>'
				+ '</div></article>';
		}).join('');
	}

	async function refreshBoard() {
		const json = await api({ action: 'list' });
		if (!json.ok) return;
		boardItems = json.items || [];
		paintBoardFilters();
		applyBoardFilters();
	}

	async function openCard(id) {
		const json = await api({ action: 'get', id: id });
		if (!json.ok) {
			setStatus('err', json.error || 'Could not open this card.');
			return;
		}
		ensureAgentRows(neededAgents(json.fields || {}));
		setCardPerms(json.permissions || meBase);
		fill(Object.assign({ id: json.id }, json.fields || {}));
		history.replaceState({}, '', '/shop-tc/?id=' + encodeURIComponent(json.id));
		setStatus('ok', 'Card opened. Edit only the section your role is trusted with, then save.');
		await refreshBoard();
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}

	function resetForm() {
		form.reset();
		if (field('id')) field('id').value = '';
		if (field('vatPercent')) field('vatPercent').value = '5';
		if (field('reviewDate')) field('reviewDate').value = new Date().toISOString().slice(0, 10);
		ensureAgentRows(1);
		for (let n = 1; n <= 14; n++) {
			if (field('check' + n + 'Evidence')) field('check' + n + 'Evidence').value = '';
			if (field('check' + n + 'FileId')) field('check' + n + 'FileId').value = '';
			if (field('check' + n + 'FileName')) field('check' + n + 'FileName').value = '';
		}
		syncAgentCount();
		syncMoney();
		syncChecks();
		paintEvidence();
		paintAllChoices();
		paintResult();
		form.querySelectorAll('.sc-check-row.is-open').forEach(function (row) { row.classList.remove('is-open'); });
		syncWhen();
		history.replaceState({}, '', '/shop-tc/');
		setCardPerms(meBase);
		setStatus('', '');
		refreshBoard();
	}

	async function saveCard(andDownload) {
		const data = formData();
		markCheckGaps();
		const errors = validateDeal(data);
		if (errors.length) {
			setStatus('err', errors.join(' '));
			const firstOpen = form.querySelector('.sc-check-row.is-open');
			if (firstOpen) firstOpen.scrollIntoView({ behavior: 'smooth', block: 'center' });
			else if (!data.dealId && field('dealId')) field('dealId').focus();
			return;
		}
		const json = await api(Object.assign(data, { action: 'save' }));
		if (!json.ok) {
			setStatus('err', json.error || 'Could not save.');
			return;
		}
		if (json.id && field('id')) field('id').value = json.id;
		if (json.permissions) setCardPerms(json.permissions);
		history.replaceState({}, '', '/shop-tc/?id=' + encodeURIComponent(json.id));
		await refreshBoard();
		if (andDownload && json.download) {
			triggerDownload(json.download, json.pdfName);
			setStatus('ok', 'Saved your section. Downloading ' + (json.pdfName || 'the PDF') + '.');
			return;
		}
		setStatus('ok', 'Saved your section. The next role picks this card up from Deal scouting.');
	}

	form.addEventListener('click', async function (e) {
		const saveBtn = e.target.closest('[data-save]');
		const dlBtn = e.target.closest('[data-download]');
		if (!saveBtn && !dlBtn) return;
		e.preventDefault();
		const btn = saveBtn || dlBtn;
		btn.disabled = true;
		try {
			await saveCard(!!dlBtn);
		} catch (err) {
			setStatus('err', 'Network error.');
		} finally {
			btn.disabled = false;
		}
	});

	cardsHost.addEventListener('click', async function (e) {
		const editBtn = e.target.closest('[data-edit]');
		const dlBtn = e.target.closest('[data-card-download]');
		if (editBtn) {
			e.preventDefault();
			await openCard(editBtn.getAttribute('data-edit'));
			return;
		}
		if (dlBtn) {
			e.preventDefault();
			triggerDownload(
				'/shop-tc/api.php?action=download&id=' + encodeURIComponent(dlBtn.getAttribute('data-card-download')),
				dlBtn.getAttribute('data-name')
			);
		}
	});

	const board = document.querySelector('.sc-board');
	if (board) {
		board.addEventListener('click', function (e) {
			const periodBtn = e.target.closest('[data-filter-period]');
			const resultBtn = e.target.closest('[data-filter-result]');
			if (periodBtn) {
				filterPeriod = periodBtn.getAttribute('data-filter-period') || 'all';
				paintBoardFilters();
				applyBoardFilters();
			}
			if (resultBtn) {
				filterResult = resultBtn.getAttribute('data-filter-result') || '';
				paintBoardFilters();
				applyBoardFilters();
			}
		});
	}
	const agentFilter = document.getElementById('sc-filter-agent');
	if (agentFilter) {
		agentFilter.addEventListener('input', applyBoardFilters);
	}

	const newBtn = document.getElementById('sc-new');
	if (newBtn) newBtn.addEventListener('click', resetForm);

	const addBtn = document.getElementById('sc-add-agent');
	if (addBtn) addBtn.addEventListener('click', addAgentRow);

	const agentsBox = agentHost();
	if (agentsBox) {
		agentsBox.addEventListener('click', function (e) {
			const btn = e.target.closest('[data-remove-agent]');
			if (!btn) return;
			if (!roleState().canAddAgent) return;
			e.preventDefault();
			const row = btn.closest('[data-agent]');
			if (row) removeAgentRow(row);
		});
	}

	form.addEventListener('click', function (e) {
		const btn = e.target.closest('[data-choice-val]');
		const host = btn && btn.closest('[data-choice]');
		const input = choiceInput(host);
		if (!input) return;
		if (host.classList.contains('is-locked') || !canField(host.getAttribute('data-choice'))) return;
		e.preventDefault();
		const val = btn.getAttribute('data-choice-val') || '';
		input.value = input.value === val ? '' : val;
		paintChoice(host.getAttribute('data-choice'));
		syncWhen();
	});

	syncAgentCount();
	syncMoney();
	syncChecks();
	paintEvidence();
	paintAllChoices();
	paintResult();
	syncWhen();
	applyLocks();
	const lockBtn = document.getElementById('sc-lock-commission');
	if (lockBtn) {
		lockBtn.addEventListener('click', function () {
			if (!roleState().canLockCommission) return;
			if (field('commissionLocked')) field('commissionLocked').value = 'yes';
			setStatus('ok', 'Final figures locked. Save your section so the rate card check is stored.');
		});
	}
	refreshBoard().then(function () {
		const startId = currentId();
		if (startId) openCard(startId);
	});
})();
