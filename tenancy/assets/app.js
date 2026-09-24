(function () {
	const form = document.getElementById('tc-form');
	const status = document.getElementById('tc-status');
	if (!form) return;

	function setStatus(type, text) {
		status.hidden = !text;
		status.className = 'tc-status ' + (type || '');
		status.textContent = text || '';
	}

	function field(name) {
		return form.querySelector('[name="' + name + '"]');
	}

	function fill(map) {
		Object.keys(map).forEach(function (key) {
			const el = field(key);
			if (el && map[key]) el.value = map[key];
		});
	}

	function pad2(n) {
		return String(n).padStart(2, '0');
	}

	function parseYmd(value) {
		const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || '').trim());
		if (!m) return null;
		return { y: Number(m[1]), mo: Number(m[2]), d: Number(m[3]) };
	}

	function toYmd(y, mo, d) {
		return y + '-' + pad2(mo) + '-' + pad2(d);
	}

	function addOneYearTo(fromValue) {
		const p = parseYmd(fromValue);
		if (!p) return '';
		const end = new Date(p.y + 1, p.mo - 1, p.d);
		end.setDate(end.getDate() - 1);
		return toYmd(end.getFullYear(), end.getMonth() + 1, end.getDate());
	}

	function syncPeriodDates(source) {
		const contractEl = field('contractDate');
		const fromEl = field('dateFrom');
		const toEl = field('dateTo');
		if (!fromEl || !toEl) return;
		if (source === 'contract' && contractEl && contractEl.value) {
			fromEl.value = contractEl.value;
		}
		if (!fromEl.value && contractEl && contractEl.value) {
			fromEl.value = contractEl.value;
		}
		if (!fromEl.value) return;
		toEl.value = addOneYearTo(fromEl.value);
	}

	function moneyNumber(value) {
		const n = parseFloat(String(value || '').replace(/,/g, '').replace(/[^\d.]/g, ''));
		return isNaN(n) ? 0 : n;
	}

	function onDateFieldEvent(e) {
		const name = e.target && e.target.getAttribute('name');
		if (name === 'contractDate') syncPeriodDates('contract');
		if (name === 'dateFrom') syncPeriodDates('from');
		if (name === 'annualRent' || name === 'contractValue') syncDeposit();
	}

	form.addEventListener('change', onDateFieldEvent);
	form.addEventListener('input', onDateFieldEvent);
	form.addEventListener('blur', onDateFieldEvent, true);

	function syncDeposit() {
		const rent = moneyNumber(field('annualRent') && field('annualRent').value);
		const valueEl = field('contractValue');
		const depositEl = field('deposit');
		if (!valueEl || !depositEl) return;
		if (!valueEl.value && rent > 0) {
			valueEl.value = String(Math.round(rent * 100) / 100);
		}
		const base = moneyNumber(valueEl.value) || rent;
		if (base > 0) {
			depositEl.value = String(Math.round(base * 0.05 * 100) / 100);
		}
	}

	syncPeriodDates('contract');
	syncDeposit();

	function formData() {
		const data = {};
		new FormData(form).forEach(function (value, key) {
			data[key] = value;
		});
		if (!data.dateFrom && data.contractDate) data.dateFrom = data.contractDate;
		if (!data.dateTo && data.dateFrom) data.dateTo = addOneYearTo(data.dateFrom);
		if (!data.contractValue) data.contractValue = data.annualRent;
		const base = moneyNumber(data.contractValue || data.annualRent);
		if (!data.deposit && base > 0) data.deposit = String(Math.round(base * 0.05 * 100) / 100);
		return data;
	}

	let step = 1;

	function showStep(n) {
		step = n;
		form.querySelectorAll('[data-panel]').forEach(function (panel) {
			panel.hidden = Number(panel.getAttribute('data-panel')) !== n;
		});
		document.querySelectorAll('.tc-stepper [data-goto]').forEach(function (btn) {
			btn.classList.toggle('is-on', Number(btn.getAttribute('data-goto')) === n);
		});
		if (n === 3) fillSummary();
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}

	function missingDetails() {
		const data = formData();
		if (!data.tenantName) return 'Add the tenant name.';
		if (!data.landlordName) return 'Add the owner name.';
		if (!data.dateFrom || !data.dateTo) return 'Add the From and To dates.';
		if (!data.annualRent) return 'Add the annual rent.';
		return '';
	}

	function captureSendEmails() {
		const out = {};
		form.querySelectorAll('[data-send-email]').forEach(function (inp) {
			out[inp.getAttribute('data-send-email')] = inp.value;
		});
		return out;
	}

	function fillSummary() {
		const host = document.getElementById('tc-summary');
		if (!host) return;
		const saved = captureSendEmails();
		const d = formData();
		const tenantEmail = saved.tenant !== undefined ? saved.tenant : (d.tenantEmail || '');
		const ownerEmail = saved.owner !== undefined ? saved.owner : (d.landlordEmail || '');
		host.innerHTML = '<div><b>Tenant:</b> ' + esc(d.tenantName) + (d.tenantPhone ? ' · ' + esc(d.tenantPhone) : ' · no phone') + '</div>'
			+ emailField('Tenant', 'tenant', tenantEmail)
			+ '<div><b>Owner:</b> ' + esc(d.landlordName) + (d.landlordPhone ? ' · ' + esc(d.landlordPhone) : ' · no phone') + '</div>'
			+ emailField('Owner', 'owner', ownerEmail)
			+ '<div><b>Property:</b> ' + esc(d.propertyNo || d.building || '—') + (d.location ? ' · ' + esc(d.location) : '') + '</div>'
			+ '<div><b>Period:</b> ' + esc(d.dateFrom) + ' to ' + esc(d.dateTo) + ' · Rent AED ' + esc(d.annualRent) + '</div>'
			+ '<div><b>Template:</b> Unified Tenancy Contract (Ejari)</div>';
	}

	function emailField(label, party, value) {
		return '<label class="tc-send-email"><span>' + label + ' email</span>'
			+ '<input type="email" data-send-email="' + party + '" value="' + esc(value) + '" placeholder="Enter ' + label.toLowerCase() + ' email">'
			+ '</label>';
	}

	function emailForParty(party) {
		const inp = form.querySelector('[data-send-email="' + party + '"]');
		if (inp) {
			const typed = String(inp.value || '').trim();
			if (typed) return typed;
		}
		const formKey = party === 'owner' ? 'landlordEmail' : 'tenantEmail';
		return String(field(formKey) && field(formKey).value || '').trim();
	}

	function syncEmailsToForm() {
		const tenant = emailForParty('tenant');
		const owner = emailForParty('owner');
		if (field('tenantEmail')) field('tenantEmail').value = tenant;
		if (field('landlordEmail')) field('landlordEmail').value = owner;
	}

	function phoneForParty(party) {
		const formKey = party === 'owner' ? 'landlordPhone' : 'tenantPhone';
		return String(field(formKey) && field(formKey).value || '').trim();
	}

	async function prepareContract() {
		syncEmailsToForm();
		const prep = await api(Object.assign(formData(), { action: 'prepare' }));
		if (!prep.ok) {
			setStatus('err', prep.error || 'Could not make the PDF.');
			return null;
		}
		if (prep.id) field('id').value = prep.id;
		return prep;
	}

	async function sendEmailParty(party, prepId) {
		return api({
			action: 'email',
			id: prepId,
			party: party,
			tenantEmail: emailForParty('tenant'),
			landlordEmail: emailForParty('owner'),
		});
	}

	async function sendWhatsAppParty(party) {
		return api(Object.assign(formData(), { action: 'whatsapp', party: party }));
	}

	function triggerDownload(url, name) {
		const a = document.createElement('a');
		a.href = url;
		a.download = name || 'tenancy-contract.pdf';
		a.rel = 'noopener';
		document.body.appendChild(a);
		a.click();
		a.remove();
	}

	document.querySelector('.tc-stepper').addEventListener('click', function (e) {
		const btn = e.target.closest('[data-goto]');
		if (!btn) return;
		const n = Number(btn.getAttribute('data-goto'));
		if (n > 1) {
			const miss = missingDetails();
			if (miss) {
				setStatus('err', miss);
				showStep(1);
				return;
			}
		}
		if (n === 3 && !form.querySelector('[name="template"]:checked')) {
			setStatus('err', 'Pick a template first.');
			showStep(2);
			return;
		}
		setStatus('', '');
		showStep(n);
	});

	form.addEventListener('click', function (e) {
		if (e.target.closest('[data-next]')) {
			e.preventDefault();
			if (step === 1) {
				const miss = missingDetails();
				if (miss) {
					setStatus('err', miss);
					return;
				}
				setStatus('', '');
				showStep(2);
				return;
			}
			if (step === 2) {
				if (!form.querySelector('[name="template"]:checked')) {
					setStatus('err', 'Pick a template first.');
					return;
				}
				setStatus('', '');
				showStep(3);
			}
			return;
		}
		if (e.target.closest('[data-back]')) {
			e.preventDefault();
			setStatus('', '');
			showStep(Math.max(1, step - 1));
		}
	});

	form.querySelectorAll('.tc-template').forEach(function (card) {
		card.addEventListener('click', function () {
			form.querySelectorAll('.tc-template').forEach(function (el) { el.classList.remove('is-on'); });
			card.classList.add('is-on');
			const radio = card.querySelector('input[type="radio"]');
			if (radio) radio.checked = true;
		});
	});

	async function api(body) {
		const res = await fetch('/tenancy/api.php', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(body),
			credentials: 'same-origin',
		});
		return res.json();
	}

	async function lookup(entity, id) {
		return api({ action: 'lookup', entity: entity, id: id });
	}

	function badgeFor(containerId, found, message, extra) {
		const host = document.getElementById(containerId);
		if (!host) return;
		let badge = host.parentElement.querySelector('.tc-badge');
		if (!badge) {
			badge = document.createElement('div');
			badge.className = 'tc-badge';
			host.after(badge);
		}
		badge.textContent = (found ? 'In Bitrix: ' : 'Not in Bitrix: ') + message + (extra || '');
		badge.style.color = found ? '#1e7a32' : '#8a5a00';
	}

	function mountSelector(nodeId, entities, onPick) {
		const node = document.getElementById(nodeId);
		if (!node || !BX.UI || !BX.UI.EntitySelector) return;
		const selector = new BX.UI.EntitySelector.TagSelector({
			multiple: false,
			placeholder: 'Search Bitrix…',
			dialogOptions: {
				context: 'a7-tenancy-' + nodeId,
				entities: entities,
				dropdownMode: true,
			},
			events: {
				onTagAdd: function (event) {
					const tag = event.getData().tag;
					onPick({
						id: tag.getId(),
						entityId: tag.getEntityId(),
						title: tag.getTitle(),
					});
				},
				onTagRemove: function () {
					onPick(null);
				},
			},
		});
		selector.renderTo(node);
	}

	function entityKey(entityId) {
		if (entityId === 'contact' || entityId === 'company' || entityId === 'lead') return entityId;
		if (String(entityId).indexOf('1112') !== -1) return 'unit';
		return entityId;
	}

	BX.ready(function () {
		mountSelector('tenant-selector', [
			{ id: 'contact', dynamicLoad: true, dynamicSearch: true },
			{ id: 'company', dynamicLoad: true, dynamicSearch: true },
			{ id: 'lead', dynamicLoad: true, dynamicSearch: true },
		], async function (item) {
			if (!item) {
				field('tenantId').value = '';
				field('tenantEntity').value = '';
				return;
			}
			field('tenantName').value = item.title || field('tenantName').value;
			field('tenantId').value = item.id;
			field('tenantEntity').value = item.entityId === 'company' ? 'company' : (item.entityId === 'lead' ? 'lead' : 'contact');
			const info = await lookup(entityKey(item.entityId), item.id);
			if (info.found && info.data) {
				fill({
					tenantName: info.data.name || item.title,
					tenantEmail: info.data.email,
					tenantPhone: info.data.phone,
				});
				let extra = '';
				if (info.data.duplicates && info.data.duplicates.length) {
					extra = '  (' + (info.data.duplicates.length + 1) + ' contacts with a similar name — pick the right one)';
				}
				badgeFor('tenant-selector', true, info.message, extra);
			} else {
				badgeFor('tenant-selector', false, info.message || 'Type the details below.');
			}
		});

		mountSelector('landlord-selector', [
			{ id: 'contact', dynamicLoad: true, dynamicSearch: true },
		], async function (item) {
			if (!item) {
				field('landlordId').value = '';
				return;
			}
			field('landlordId').value = item.id;
			field('landlordName').value = item.title || field('landlordName').value;
			const info = await lookup('contact', item.id);
			if (info.found && info.data) {
				fill({
					landlordName: info.data.name || item.title,
					landlordEmail: info.data.email,
					landlordPhone: info.data.phone,
				});
				let extra = '';
				if (info.data.duplicates && info.data.duplicates.length) {
					extra = '  (' + (info.data.duplicates.length + 1) + ' similar contacts)';
				}
				badgeFor('landlord-selector', true, info.message, extra);
			} else {
				badgeFor('landlord-selector', false, info.message || 'Type the details below.');
			}
		});

		mountSelector('unit-selector', [
			{ id: 'dynamic', dynamicLoad: true, dynamicSearch: true, options: { entityTypeId: 1112 } },
		], async function (item) {
			if (!item) {
				field('unitId').value = '';
				return;
			}
			field('unitId').value = item.id;
			const info = await lookup('unit', item.id);
			if (info.found && info.data) {
				fill({
					propertyNo: info.data.unitNo || info.data.title,
					building: info.data.building,
					location: info.data.location,
					plotNo: info.data.plotNo,
					size: info.data.size,
					landlordName: info.data.ownerName || field('landlordName').value,
					landlordEmail: info.data.ownerEmail || field('landlordEmail').value,
					landlordPhone: info.data.ownerPhone || field('landlordPhone').value,
				});
				badgeFor('unit-selector', true, info.data.title || 'Owner’s unit found.');
			} else {
				badgeFor('unit-selector', false, 'Unit not found — type property details.');
			}
		});
	});

	form.addEventListener('click', async function (e) {
		const waBtn = e.target.closest('[data-wa]');
		const dlBtn = e.target.closest('[data-download]');
		const saveBtn = e.target.closest('[data-save]');
		const emailBtn = e.target.closest('[data-email]');
		if (!waBtn && !dlBtn && !saveBtn && !emailBtn) return;
		e.preventDefault();
		const miss = missingDetails();
		if (miss) {
			setStatus('err', miss);
			showStep(1);
			return;
		}
		const btn = waBtn || dlBtn || saveBtn || emailBtn;
		const waBoth = waBtn && waBtn.getAttribute('data-wa') === 'both';
		const emailBoth = emailBtn && emailBtn.getAttribute('data-email') === 'both';
		let waWin = null;
		let waWin2 = null;
		if (waBtn) {
			waWin = window.open('about:blank', '_blank');
			if (waBoth) waWin2 = window.open('about:blank', '_blank');
		}
		btn.disabled = true;
		try {
			if (emailBoth) {
				fillSummary();
				const tenantTo = emailForParty('tenant');
				const ownerTo = emailForParty('owner');
				if (!tenantTo && !ownerTo) {
					setStatus('err', 'Add tenant and/or owner email below, then click again.');
					const inp = form.querySelector('[data-send-email="tenant"]');
					if (inp) inp.focus();
					return;
				}
				const prep = await prepareContract();
				if (!prep) return;
				const mailed = [];
				const failed = [];
				if (tenantTo) {
					const t = await sendEmailParty('tenant', prep.id);
					if (t.ok) mailed.push(t.mailed || tenantTo);
					else failed.push('tenant: ' + (t.error || 'failed'));
				}
				if (ownerTo) {
					const o = await sendEmailParty('owner', prep.id);
					if (o.ok) mailed.push(o.mailed || ownerTo);
					else failed.push('owner: ' + (o.error || 'failed'));
				}
				if (field('tenantEmail')) field('tenantEmail').value = emailForParty('tenant');
				if (field('landlordEmail')) field('landlordEmail').value = emailForParty('owner');
				fillSummary();
				if (mailed.length && !failed.length) {
					setStatus('ok', 'Contract emailed to ' + mailed.join(' and ') + '.');
				} else if (mailed.length) {
					setStatus('warn', 'Sent to ' + mailed.join(', ') + '. Failed: ' + failed.join('; ') + '.');
				} else {
					setStatus('err', failed.join('; '));
				}
				return;
			}
			if (emailBtn) {
				const party = emailBtn.getAttribute('data-email');
				const to = emailForParty(party);
				if (!to) {
					fillSummary();
					const inp = form.querySelector('[data-send-email="' + party + '"]');
					setStatus('err', 'Add the ' + party + ' email in the box below, then click again.');
					if (inp) inp.focus();
					return;
				}
				const prep = await prepareContract();
				if (!prep) return;
				const json = await sendEmailParty(party, prep.id);
				if (!json.ok) {
					setStatus('err', json.error || 'Email failed.');
					return;
				}
				if (field('tenantEmail')) field('tenantEmail').value = emailForParty('tenant');
				if (field('landlordEmail')) field('landlordEmail').value = emailForParty('owner');
				fillSummary();
				setStatus('ok', 'Contract emailed to ' + (json.mailed || to) + '.');
				return;
			}
			if (saveBtn) {
				const stage = saveBtn.getAttribute('data-save') === 'review' ? 'review' : 'draft';
				const json = await api(Object.assign(formData(), { action: 'save', stage: stage }));
				if (!json.ok) {
					setStatus('err', json.error || 'Could not save.');
					return;
				}
				if (json.id) field('id').value = json.id;
				let msg = stage === 'review'
					? 'Saved to Under review in e-Signature.'
					: 'Saved to Draft in e-Signature.';
				if (json.signError) msg += ' ' + json.signError;
				setStatus(json.signError ? 'warn' : 'ok', msg);
				if (json.signUrl && json.signUrl.indexOf('/sign/doc/') === 0) {
					window.open(json.signUrl, '_blank');
				} else {
					window.open('/sign/', '_blank');
				}
				return;
			}
			if (dlBtn) {
				const json = await prepareContract();
				if (!json) return;
				triggerDownload(json.download, json.pdfName);
				setStatus('ok', 'Downloading ' + (json.pdfName || 'the contract PDF') + '.');
				return;
			}
			if (waBoth) {
				const missing = [];
				if (!phoneForParty('tenant')) missing.push('tenant phone');
				if (!phoneForParty('owner')) missing.push('owner phone');
				if (missing.length) {
					if (waWin) waWin.close();
					if (waWin2) waWin2.close();
					setStatus('err', 'Add ' + missing.join(' and ') + ' on step 1 first.');
					showStep(1);
					return;
				}
				const prep = await prepareContract();
				if (!prep) {
					if (waWin) waWin.close();
					if (waWin2) waWin2.close();
					return;
				}
				triggerDownload(prep.download, prep.pdfName);
				const tJson = await sendWhatsAppParty('tenant');
				const oJson = await sendWhatsAppParty('owner');
				if (!tJson.ok || !oJson.ok) {
					if (waWin) waWin.close();
					if (waWin2) waWin2.close();
					const parts = [];
					if (!tJson.ok) parts.push('tenant: ' + (tJson.error || 'failed'));
					if (!oJson.ok) parts.push('owner: ' + (oJson.error || 'failed'));
					setStatus('err', parts.join('; '));
					return;
				}
				if (tJson.waMe && waWin) waWin.location.href = tJson.waMe;
				else if (waWin) waWin.close();
				if (oJson.waMe && waWin2) waWin2.location.href = oJson.waMe;
				else if (waWin2) waWin2.close();
				setStatus('ok', 'PDF downloaded. Two WhatsApp chats opened — attach the PDF in each and send.');
				return;
			}
			const party = waBtn.getAttribute('data-wa');
			const json = await sendWhatsAppParty(party);
			if (!json.ok) {
				if (waWin) waWin.close();
				setStatus('err', json.error || 'WhatsApp failed.');
				return;
			}
			if (json.id) field('id').value = json.id;
			if (json.download) triggerDownload(json.download, json.pdfName);
			if (json.waMe && waWin) waWin.location.href = json.waMe;
			else if (waWin) waWin.close();
			setStatus('ok', 'PDF downloaded (' + (json.pdfName || 'contract') + '). WhatsApp chat opened — attach the PDF and send.');
		} catch (err) {
			if (waWin) waWin.close();
			if (waWin2) waWin2.close();
			setStatus('err', 'Network error.');
		} finally {
			btn.disabled = false;
		}
	});

	function esc(s) {
		return String(s || '').replace(/[&<>"]/g, function (c) {
			return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c];
		});
	}
})();
