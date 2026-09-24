<?php

require $_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/main/include/prolog_before.php';

global $USER;
if (!is_object($USER) || !$USER->IsAuthorized()) {
	LocalRedirect('/auth/?backurl=' . urlencode('/tenancy/'));
}

require $_SERVER['DOCUMENT_ROOT'] . '/bitrix/header.php';

use Bitrix\Main\UI\Extension;

global $USER, $APPLICATION;

$APPLICATION->SetTitle('Tenancy Contract');
Extension::load(['ui.forms', 'ui.buttons', 'ui.alerts', 'ui.entity-selector', 'ui.fonts.opensans']);

$agentName = trim($USER->GetFullName() ?: $USER->GetLogin());
$agentEmail = (string)$USER->GetEmail();
?>
<link rel="stylesheet" href="/tenancy/assets/app.css?v=12">

<div class="tc-wrap">
	<div class="tc-hero">
		<h1>Tenancy Contract</h1>
		<p>Fill the details, pick the PDF template, then send on WhatsApp. That downloads the filled contract and opens the chat so you can attach it.</p>
		<?php if ($agentEmail !== ''): ?>
			<div class="tc-agent">Agent (you): <strong><?= htmlspecialchars($agentName) ?></strong> · <?= htmlspecialchars($agentEmail) ?></div>
		<?php endif; ?>
	</div>

	<nav class="tc-stepper" aria-label="Steps">
		<button type="button" class="is-on" data-goto="1">1. Details</button>
		<button type="button" data-goto="2">2. Template</button>
		<button type="button" data-goto="3">3. Send</button>
	</nav>

	<div id="tc-status" class="tc-status" hidden></div>

	<form id="tc-form" class="tc-form" autocomplete="off">
		<input type="hidden" name="tenantId" value="">
		<input type="hidden" name="tenantEntity" value="">
		<input type="hidden" name="landlordId" value="">
		<input type="hidden" name="unitId" value="">
		<input type="hidden" name="id" value="">

		<div data-panel="1">
			<section>
				<h2>1. Tenant</h2>
				<p class="tc-hint">Search CRM (contact, company, or lead). If it is not there, type the name anyway.</p>
				<div id="tenant-selector"></div>
				<div class="tc-grid">
					<label>Tenant name <input name="tenantName" required placeholder="DXL Delivery Services LLC"></label>
					<label>Tenant email <input name="tenantEmail" type="email" placeholder="optional"></label>
					<label>Phone <input name="tenantPhone" placeholder="WhatsApp number"></label>
				</div>
			</section>

			<section>
				<h2>2. Owner</h2>
				<p class="tc-hint">Owner / landlord — not A7. Search CRM or type.</p>
				<div id="landlord-selector"></div>
				<div class="tc-grid">
					<label>Owner name <input name="landlordName" required placeholder="Owner name"></label>
					<label>Owner email <input name="landlordEmail" type="email" placeholder="optional"></label>
					<label>Phone <input name="landlordPhone" placeholder="WhatsApp number"></label>
				</div>
			</section>

			<section>
				<h2>3. Property</h2>
				<div id="unit-selector"></div>
				<div class="tc-grid">
					<label>Usage
						<select name="usage">
							<option>Commercial</option>
							<option>Residential</option>
							<option>Industrial</option>
						</select>
					</label>
					<label>Location <input name="location" placeholder="International City"></label>
					<label>Building <input name="building" placeholder="England Cluster Y-23"></label>
					<label>Property no <input name="propertyNo" placeholder="Shop 22"></label>
					<label>Property type <input name="propertyType" value="Shop"></label>
					<label>Size (sqm) <input name="size"></label>
					<label>Plot no <input name="plotNo"></label>
					<label>DEWA premises no <input name="dewaNo"></label>
				</div>
			</section>

			<section>
				<h2>4. Rent</h2>
				<div class="tc-grid">
					<label>Contract date <input name="contractDate" type="date" value="<?= htmlspecialchars(date('Y-m-d')) ?>"></label>
					<label>From <input name="dateFrom" type="date" required></label>
					<label>To <input name="dateTo" type="date" required></label>
					<label>Annual rent (AED) <input name="annualRent" required placeholder="55000"></label>
					<label>Contract value (AED) <input name="contractValue" placeholder="same as rent"></label>
					<label>Security deposit (AED) <input name="deposit" placeholder="5% of contract value"></label>
					<label>Payment
						<select name="paymentMode">
							<option>01 cheque</option>
							<option selected>04 cheques</option>
							<option>06 cheques</option>
							<option>12 cheques</option>
							<option>Cash / transfer</option>
						</select>
					</label>
				</div>
			</section>

			<div class="tc-actions">
				<button type="button" class="ui-btn ui-btn-primary" data-next>Next: choose template</button>
			</div>
		</div>

		<div data-panel="2" hidden>
			<section>
				<h2>Choose template</h2>
				<p class="tc-hint">The form you just filled is written onto this PDF. More templates can be added later.</p>
				<div class="tc-templates">
					<label class="tc-template is-on">
						<input type="radio" name="template" value="ejari" checked>
						<img src="/tenancy/assets/ejari-blank-p1.jpg" alt="Unified Tenancy Contract preview">
						<span>
							<strong>Unified Tenancy Contract (Ejari)</strong>
							<span class="tc-hint">Dubai Land Department official bilingual form. Tenant, owner, property and rent go into this PDF.</span>
						</span>
					</label>
				</div>
			</section>
			<div class="tc-actions">
				<button type="button" class="ui-btn ui-btn-light" data-back>Back</button>
				<button type="button" class="ui-btn ui-btn-primary" data-next>Next: send</button>
			</div>
		</div>

		<div data-panel="3" hidden>
			<section>
				<h2>Send the contract</h2>
				<p class="tc-hint">WhatsApp downloads the filled PDF and opens the chat. Type missing emails below — Send page email overrides step 1. Use <b>Both</b> to send tenant and owner together.</p>
				<div id="tc-summary" class="tc-summary"></div>
				<div class="tc-actions">
					<button type="button" class="ui-btn ui-btn-success" data-wa="tenant">WhatsApp tenant</button>
					<button type="button" class="ui-btn ui-btn-success" data-wa="owner">WhatsApp owner</button>
					<button type="button" class="ui-btn" data-email="tenant">Email tenant</button>
					<button type="button" class="ui-btn" data-email="owner">Email owner</button>
					<button type="button" class="ui-btn" data-download>Download PDF</button>
				</div>
				<div class="tc-actions tc-send-both">
					<span class="tc-send-both-label">Both at once</span>
					<button type="button" class="ui-btn ui-btn-success ui-btn-sm" data-wa="both">WhatsApp both</button>
					<button type="button" class="ui-btn ui-btn-sm" data-email="both">Email both</button>
				</div>
				<div class="tc-actions">
					<button type="button" class="ui-btn ui-btn-primary" data-save="draft">Save to draft</button>
					<button type="button" class="ui-btn" data-save="review">Human review</button>
				</div>
			</section>
			<div class="tc-actions">
				<button type="button" class="ui-btn ui-btn-light" data-back>Back</button>
			</div>
		</div>
	</form>
</div>

<script src="/tenancy/assets/app.js?v=12"></script>
<?php
require $_SERVER['DOCUMENT_ROOT'] . '/bitrix/footer.php';
