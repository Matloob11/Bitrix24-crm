<?php
require($_SERVER["DOCUMENT_ROOT"]."/bitrix/header.php");
$APPLICATION->setTitle("Dashboard");

require("./handler/main.php");

?>

<html lang="en">

<head>

  <!-- -->
  <link rel="icon" type="image/x-icon" href="assets/favicon.ico" />
  <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons/font/bootstrap-icons.css" rel="stylesheet">

  <link href="css/styles.css" rel="stylesheet" />
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <link href="https://cdn.jsdelivr.net/npm/flatpickr/dist/flatpickr.min.css" rel="stylesheet" />
  <!-- Flatpickr JS -->
  <script src="https://cdn.jsdelivr.net/npm/flatpickr"></script>

</head>

<div style="background-color:#b08d5d ;">

  <div class="container bg-light rounded-3 text-center">
    <div class="row">

      <!-- Sidebar -->
      <div class="col-md-3 border rounded" style="padding: 15px 10px; background-color:#b08d5d;">

        <!-- Profile -->
          <div class="text-center mb-3">
              <img src="<?=htmlspecialchars($userPhoto)?>" style="width:50%; display:block; margin:0 auto;" class="card-img-top rounded-circle"
                   alt="Profile">
              <p style="color:white; margin-top: 10px;">
                  <b><?=htmlspecialchars($userName)?></b><br><?=htmlspecialchars($userDesignation)?>
              </p>

              <?php if ($isAdmin && !empty($agentsList)): ?>
                  <div class="dropdown mt-2">
                      <button
                              class="btn btn-light btn-sm dropdown-toggle"
                              type="button"
                              id="agentDropdown"
                              data-bs-toggle="dropdown"
                              aria-expanded="false"
                      >
                          Agent Name
                      </button>
                      <ul class="dropdown-menu" aria-labelledby="agentDropdown">
                          <?php foreach ($agentsList as $agent): ?>
                              <li>
                                  <a class="dropdown-item" href="?agent=<?=htmlspecialchars($agent['ID'])?>">
                                      <?=htmlspecialchars($agent['NAME'].' '.$agent['LAST_NAME'])?>
                                  </a>
                              </li>
                          <?php endforeach; ?>
                      </ul>
                  </div>
              <?php endif; ?>



              <!-- Stats Block -->
            <div class="stats-wrapper">
                <div class="stats-row">
                    <div class="stat-item">
                        <div class="stat-value"><?=htmlspecialchars($saleCount)?></div>
                        <div class="stat-label">Total Properties For Sale</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value"><?=htmlspecialchars($rentCount)?></div>
                        <div class="stat-label">Total Properties For Rent</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value"><?=htmlspecialchars($totalDeals)?></div>
                        <div class="stat-label">Total Closed Deals</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value"><?=formatAmount(htmlspecialchars($totalDealAmount))?> AED</div>
                        <div class="stat-label">Total Deals Value</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- TOTAL COMMISSION -->
        <div class="card text-dark bg-light mb-3">
          <div class="card-body p-2">
            <h6 class="text-center mb-2" style="color: black; font-weight: bold;">TOTAL COMMISSION EARNED</h6>
            <div class="text-center">
              <canvas id="gaugeCanvas" width="230" height="140"></canvas>
              <div class="mt-2"
                style="background: linear-gradient(135deg, #4b1b82, #9b59b6); color: white; border-radius: 50px; font-size: 0.9rem; font-weight: 600; padding: 6px 12px;">
                AED <?=formatAmount(htmlspecialchars($commissionYearlyCreated))?></div>
            </div>
          </div>
        </div>

        <!-- TARGET ACHIEVED -->
        <div class="card text-dark bg-light mb-3">
          <div class="card-body p-2">
            <h6 class="text-center mb-2" style="color: black; font-weight: bold;">CURRENT MONTH TARGET ACHIEVED</h6>
            <div class="text-center">
              <canvas id="targetGauge" width="230" height="140"></canvas>
              <div class="mt-2"
                style="background: linear-gradient(135deg, #28a745, #6ad17f); color: white; border-radius: 50px; font-size: 0.9rem; font-weight: 600; padding: 6px 12px;">
                Target: AED 1,000,000</div>
            </div>
          </div>
        </div>
      </div>

      <!--Center Div-->
      <div class="col-md-6 middle-card" style="background: #b08d5d;">
        <div class="container py-3 px-2">

          <!-- Performance Table -->
          <div class="card">
           <table class="table table-bordered text-center align-middle mb-0">
  <thead>
    <tr>
      <th></th>
      <th><span class="metric-pill metric-today">Today</span></th>
      <th><span class="metric-pill metric-mtd">MTD</span></th>
      <th><span class="metric-pill metric-ytd">YTD</span></th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td class="text-start fw-semibold">Total No. of Viewings/Meetings</td>
      <td><span class="metric-pill metric-muted"><?=htmlspecialchars($spaDailyTotal)?></span></td>
      <td><span class="metric-pill"><?=htmlspecialchars($spaMonthlyTotal)?></span></td>
      <td><span class="metric-pill"><?=htmlspecialchars($spaYearlyTotal)?></span></td>
    </tr>
    <tr>
      <td class="text-start fw-semibold">Leads in Progress</td>
      <td><span class="metric-pill"><?=htmlspecialchars($dailyInProcess)?></span></td>
      <td><span class="metric-pill"><?=htmlspecialchars($monthlyInProcess)?></span></td>
      <td><span class="metric-pill"><?=htmlspecialchars($yearlyInProcess)?></span></td>
    </tr>
    <tr>
      <td class="text-start fw-semibold">Successful Leads</td>
      <td><span class="metric-pill"><?=htmlspecialchars($dailyWon)?></span></td>
      <td><span class="metric-pill"><?=htmlspecialchars($monthlyWon)?></span></td>
      <td><span class="metric-pill"><?=htmlspecialchars($yearlyWon)?></span></td>
    </tr>
    <tr>
      <td class="text-start fw-semibold">Junk Leads</td>
      <td><span class="metric-pill"><?=htmlspecialchars($dailyJunk)?></span></td>
      <td><span class="metric-pill"><?=htmlspecialchars($monthlyJunk)?></span></td>
      <td><span class="metric-pill"><?=htmlspecialchars($yearlyJunk)?></span></td>
    </tr>
    <tr>
      <td class="text-start fw-semibold">Total Leads</td>
      <td><span class="metric-pill"><?=htmlspecialchars($dailyTotal)?></span></td>
      <td><span class="metric-pill"><?=htmlspecialchars($monthlyTotal)?></span></td>
      <td><span class="metric-pill metric-mtd"><?=htmlspecialchars($yearlyTotal)?></span></td>
    </tr>
    <tr>
      <td class="text-start fw-semibold">Closed Deals</td>
      <td><span class="metric-pill"><?=htmlspecialchars($dealDailyTotal)?></span></td>
      <td><span class="metric-pill"><?=htmlspecialchars($dealMonthlyTotal)?></span></td>
      <td><span class="metric-pill"><?=htmlspecialchars($dealYearlyTotal)?></span></td>
    </tr>
  </tbody>
</table>


          </div>

          <!-- New Listings -->
            <div class="card">
                <table class="table table-bordered table-hover mb-0">
                    <caption class="text-start">NEW LISTINGS (SALES &amp; RENT)</caption>
                    <tbody>
                    <?php if (!empty($latestListings)): ?>
                        <?php foreach ($latestListings as $P):
                            $title   = isset($P['listing_title']) ? trim($P['listing_title']) : '';
                            $price   = $P['price'] ?? $P['property_price'] ?? null;
                            $city    = $P['property_city'] ?? '';
                            $loc     = $P['property_location'] ?? ($P['property_community'] ?? '');
                            $purpose = $P['property_purpose'] ?? ''; // 'S' or 'R'
                            $created = $P['Listing_Created_Date'] ?? ($P['created_at'] ?? '');
                            $ref     = $P['property_ref'] ?? ($P['id'] ?? '');

                            // Build detail URL safely (FIXED)
                            $detailUrl = isset($P['seo_url'])
                                ? 'https://youtupia.com/a7group/properties/'.$P['seo_url']
                                : '#';

                            // Image (defensive)
                            $img = '';
                            if (!empty($P['images']) && is_array($P['images']) && !empty($P['images'][0]['photo_url'])) {
                                $img = $P['images'][0]['photo_url'];
                            }
                            $imgSrc = $img ?: '/local/templates/.default/images/no-photo.png';
                            ?>
                            <tr>
                                <td>
                                    <a href="<?= htmlspecialchars($detailUrl) ?>">
                                        <img src="<?= htmlspecialchars($imgSrc) ?>" alt="" height="40">
                                    </a>
                                </td>
                                <td class="text-start">
                                    <a href="<?= htmlspecialchars($detailUrl) ?>">
                                        <?= htmlspecialchars($title ?: 'Untitled') ?>
                                    </a>
                                </td>
                            </tr>
                        </a>
                        <?php endforeach; ?>
                    <?php else: ?>
                        <tr><td class="text-center text-muted">No listings found.</td></tr>
                    <?php endif; ?>
                    </tbody>
                </table>
            </div>


          <!-- New LEADS -->
          <div class="card">
            <table class="table table-bordered table-hover mb-0">
              <caption>NEW LEADS (SALES & RENT) - Received</caption>
              <thead>
                <tr>
                  <th>Id</th>
                  <th>Lead Name</th>
                  <th>Status</th>
                  <th>Stages</th>
                  <th>Received On</th>
                </tr>
              </thead>
                <tbody>
                <?php if (!empty($latestLeads)): ?>
                    <?php foreach ($latestLeads as $L): ?>
                        <tr>
                            <td>
                                <a href="<?=htmlspecialchars($L['DETAIL_URL'])?>" target="_blank">
                                    <?= (int)$L['ID'] ?>
                                </a>
                            </td>
                            <td><?= htmlspecialchars($L['TITLE']) ?></td>
                            <td><?= htmlspecialchars($L['SOURCE']) ?></td>
                            <td><span class="status"><?= htmlspecialchars($L['STATUS']) ?></span></td>
                            <td><?= htmlspecialchars($L['RECEIVED']) ?></td>
                        </tr>
                    <?php endforeach; ?>
                <?php else: ?>
                    <tr><td colspan="5" style="text-align:center">No leads found</td></tr>
                <?php endif; ?>
                </tbody>
            </table>
          </div>

        </div>
      </div>

      <!--Rightside Div-->
      <div class="col-md-3 border rounded px-2 py-3" style="background-color: #b08d5d;">
          <div style="display: flex;flex-direction: column;gap:10px">

          <!-- YTD Commission -->
          <div class="card shadow-sm border-0">
            <div class="card-header bg-transparent p-0">
              <div class="d-flex align-items-center px-3 py-2 text-dark fw-semibold">
                <img src="assets/aed.jpg" alt="Dirham Icon" width="36" height="36" class="me-3" style="object-fit: contain;">
                Total Commission
              </div>
            </div>
            <div class="card-body py-2 px-3 text-success fw-bold">AED <?=formatAmount(htmlspecialchars($commissionAllTimeCreated))?></div>
          </div>

          <!-- QTD Commission -->
          <div class="card shadow-sm border-0">
            <div class="card-header bg-transparent p-0">
              <div class="d-flex align-items-center px-3 py-2 text-dark fw-semibold">
                <img src="assets/aed.jpg" alt="Dirham Icon" width="36" height="36" class="me-3" style="object-fit: contain;"> YTD Total Commission
              </div>
            </div>
            <div class="card-body py-2 px-3 text-info fw-bold">AED <?=formatAmount(htmlspecialchars($commissionYearlyCreated))?></div>
          </div>

          <!-- MTD Commission -->
          <div class="card shadow-sm border-0">
            <div class="card-header bg-transparent p-0">
              <div class="d-flex align-items-center px-3 py-2 text-dark fw-semibold">
                <img src="assets/aed.jpg" alt="Dirham Icon" width="36" height="36" class="me-3" style="object-fit: contain;">
                MTD Total Commission
              </div>
            </div>
            <div class="card-body py-2 px-3 text-warning fw-bold">AED <?=formatAmount(htmlspecialchars($commissionMonthlyCreated))?></div>
          </div>




          <!-- Running TOP 3 Agent -->
            <div class="card shadow-sm border-0 mb-1">
                <div class="card-header bg-transparent p-0">
                    <div style="font-size: 15px" class="d-flex align-items-center px-3 py-2 text-dark fw-semibold">
                        <img src="assets/medal.png" alt="Trophy Icon" width="36" height="36" class="me-3" style="object-fit: contain;">
                        Running TOP 3 Agents of the Month
                    </div>
                </div>
                <div class="card-body px-3 pt-3 pb-2 text-center">
                    <div class="row justify-content-between align-items-center mb-2">
                        <?php for ($i=0; $i<3; $i++): ?>
                            <?php
                            $name  = slot($top3Month, $i, 'name', '—');
                            $photo = slot($top3Month, $i, 'photo', '');
                            $initials = strtoupper(substr(explode(' ', $name)[0] ?? '', 0, 1) . substr(explode(' ', $name)[1] ?? '', 0, 1));
                            ?>
                            <div class="col-4 text-center">
                                <?php if ($photo && strpos($photo, 'default_user.png') === false): ?>
                                    <img
                                            src="<?= htmlspecialchars($photo) ?>"
                                            alt="<?= htmlspecialchars($name) ?>"
                                            data-bs-toggle="tooltip"
                                            title="<?= htmlspecialchars($name) ?>"
                                            class="rounded-circle border"
                                            style="width:55px;height:55px;object-fit:cover;">
                                <?php else: ?>
                                    <div class="rounded-circle bg-light d-flex align-items-center justify-content-center border"
                                         data-bs-toggle="tooltip"
                                         title="<?= htmlspecialchars($name) ?>"
                                         style="width:55px;height:55px;font-weight:600;color:#333;">
                                        <?= htmlspecialchars($initials ?: substr($name, 0, 1)) ?>
                                    </div>
                                <?php endif; ?>
                                <p class="fw-semibold" style="margin-top:6px;font-size:0.8rem;color:#555;">
                                    #<?=$i + 1?>
                                </p>
                            </div>

                        <?php endfor; ?>
                    </div>

                </div>
            </div>



            <!-- Running TOP 10 Agent of YTD -->
            <div class="card shadow-sm border-0 mb-1">
                <div class="card-header bg-transparent p-0">
                    <div style="font-size: 15px" class="d-flex align-items-center px-3 py-2 text-dark fw-semibold">
                        <img src="assets/medal.png" alt="Trophy Icon" width="36" height="36" class="me-3" style="object-fit: contain;">
                        Running TOP 10 Agents of the Year
                    </div>
                </div>
                <?php
                $itemsPerSlide = 3;
                $totalUsers    = 10;
                $slides        = (int)ceil($totalUsers / $itemsPerSlide);
                ?>

                <div id="topUsersCarousel" class="carousel slide" data-bs-ride="carousel" data-bs-interval="4000" data-bs-touch="true" data-bs-wrap="true">
                    <div class="carousel-inner">
                        <?php for ($s = 0; $s < $slides; $s++): ?>
                            <div class="carousel-item <?= $s === 0 ? 'active' : '' ?>">
                                <div class="card-body px-3 pt-3 pb-2 text-center">
                                    <div class="row justify-content-between align-items-center mb-2">
                                        <?php
                                        $start = $s * $itemsPerSlide;
                                        $end   = min($totalUsers, $start + $itemsPerSlide);
                                        for ($i = $start; $i < $end; $i++):
                                            $name     = slot($top3Year, $i, 'name', '—');
                                            $photo    = slot($top3Year, $i, 'photo', '');
                                            $parts    = explode(' ', trim($name));
                                            $initials = strtoupper(substr($parts[0] ?? '', 0, 1) . substr($parts[1] ?? '', 0, 1));
                                            ?>
                                            <div class="col-4 text-center">
                                                <?php if ($photo && strpos($photo, 'default_user.png') === false): ?>
                                                    <img src="<?= htmlspecialchars($photo) ?>" alt="<?= htmlspecialchars($name) ?>"
                                                         data-bs-toggle="tooltip" title="<?= htmlspecialchars($name) ?>"
                                                         class="rounded-circle border"
                                                         style="width:55px;height:55px;object-fit:cover;">
                                                <?php else: ?>
                                                    <div class="rounded-circle bg-light d-flex align-items-center justify-content-center border"
                                                         data-bs-toggle="tooltip" title="<?= htmlspecialchars($name) ?>"
                                                         style="width:55px;height:55px;font-weight:600;color:#333;">
                                                        <?= htmlspecialchars($initials ?: substr($name, 0, 1)) ?>
                                                    </div>
                                                <?php endif; ?>
                                                <p class="fw-semibold" style="margin-top:6px;font-size:0.8rem;color:#555;">
                                                    #<?=$i + 1?>
                                                </p>
                                            </div>
                                        <?php endfor; ?>
                                    </div>

                                </div>
                            </div>
                        <?php endfor; ?>
                    </div>

                    <div class="carousel-indicators">
                        <?php for ($i = 0; $i < $slides; $i++): ?>
                            <button
                                    type="button"
                                    data-bs-target="#topUsersCarousel"
                                    data-bs-slide-to="<?= $i ?>"
                                    class="<?= $i===0?'active':'' ?>"
                                    aria-label="Slide <?= $i+1 ?>">
                            </button>
                        <?php endfor; ?>
                    </div>

                </div>
            </div>
        </div>
      </div>
    </div>
  </div>



  <!-- Bootstrap core JS-->
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.2.3/dist/js/bootstrap.bundle.min.js"></script>

  <!-- Core theme JS-->
  <script src="js/scripts.js"></script>
  <!-- Gauge Script -->
<!-- TOTAL COMMISSION EARNED script -->
<script>
    const canvas = document.getElementById('gaugeCanvas');
  if (!canvas) {
    console.error('Missing <canvas id="gaugeCanvas">');
  } else {
    const ctx = canvas.getContext('2d');

    const monthlyLabels      = <?= json_encode($labels); ?>;
    const monthlyCommissions = <?= json_encode($values); ?>;
    const maxCommission      = <?= json_encode($maxCommission); ?>;
    const needleValue        = (function(){
      const normalized = monthlyCommissions.map(v => (v / (maxCommission || 1)) * 100);
      return normalized[<?= (int)$needleIndex ?>] ?? 0;
    })();

    const equalSlices = Array(monthlyLabels.length).fill(1);
    const gaugeChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: monthlyLabels,
        datasets: [{
          label: 'Monthly Commission',
          data: equalSlices,
            backgroundColor: [
                '#f94144',
                '#f3722c',
                '#f8961e',
                '#f9c74f',
                '#90be6d',
                '#43aa8b',
                '#4d908e',
                '#577590',
                '#277da1',
                '#4361ee',
                '#7209b7',
                '#b5179e'
            ],
          borderWidth: 0,
          needleValue: needleValue,
          actualValues: monthlyCommissions
        }]
      },
      options: {
        responsive: false,
        maintainAspectRatio: false,
        rotation: -90,
        circumference: 180,
        cutout: '70%',
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: function (context) {
                const dataset = context.dataset;
                const index = context.dataIndex;
                const value = dataset.actualValues[index];
                return `${context.label}: AED ${Number(value ?? 0).toLocaleString()}`;
              }
            }
          }
        },
        animation: { duration: 0 }
      },
      plugins: [{
        id: 'needle',
        afterDatasetDraw(chart) {
          const meta = chart.getDatasetMeta(0); // safer than _metasets
          const arc0 = meta.data?.[0];
          if (!arc0) return;

          const needleValue = chart.config.data.datasets[0].needleValue ?? 0;
          const angle = Math.PI * (needleValue / 100);

          const cx = (chart.chartArea.left + chart.chartArea.right) / 2;
          const cy = arc0.y;
          const r  = arc0.outerRadius;
          const needleLength = r - 5;

          const ctx = chart.ctx;
          ctx.save();
          ctx.translate(cx, cy);
          ctx.rotate(angle - Math.PI);
          ctx.beginPath();
          ctx.moveTo(-6, -4);
          ctx.lineTo(needleLength, 0);
          ctx.lineTo(-6, 4);
          ctx.closePath();
          ctx.fillStyle = '#000';
          ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
          ctx.shadowBlur = 4;
          ctx.fill();
          ctx.restore();

          // Center knob
          ctx.beginPath();
          ctx.arc(cx, cy, 6, 0, Math.PI * 2);
          ctx.fillStyle = '#000';
          ctx.fill();
        }
      }]
    });
      const idx = new Date().getMonth();
      const needlePercent = ((idx + 0.5) / monthlyLabels.length) * 100;
      gaugeChart.config.data.datasets[0].needleValue = needlePercent;
      gaugeChart.update();
  }
  </script>

  <script>
      const ctxConversion = document.getElementById('conversionGauge').getContext('2d');
      const conversionRate = 3; // your 3 %

      new Chart(ctxConversion, {
          type: 'doughnut',
          data: {
              labels: ['Conversion', 'Remaining'],
              datasets: [{
                  data: [conversionRate, 100 - conversionRate],
                  backgroundColor: ['#007bff', '#e9ecef'],
                  borderWidth: 0,
                  needleValue: conversionRate
              }]
          },
          options: {
              responsive: false,
              maintainAspectRatio: false,
              rotation: -90,
              circumference: 180,
              cutout: '70%',
              plugins: {
                  legend: { display: false },
                  tooltip: {
                      callbacks: {
                          label: (ctx) => `${ctx.label}: ${Math.round(ctx.raw)}%`
                      }
                  }
              },
              animation: { duration: 0 }
          },
          plugins: [{
              id: 'needle',
              afterDatasetDraw(chart) {
                  const needleValue = chart.config.data.datasets[0].needleValue;
                  const angle = Math.PI * (needleValue / 100);
                  const cx = chart.width / 2;
                  const cy = chart._metasets[0].data[0].y;
                  const r = chart._metasets[0].data[0].outerRadius;
                  const needleLength = r - 5;

                  const ctx = chart.ctx;
                  ctx.save();
                  ctx.translate(cx, cy);
                  ctx.rotate(angle - Math.PI);
                  ctx.beginPath();
                  ctx.moveTo(-6, -4);
                  ctx.lineTo(needleLength, 0);
                  ctx.lineTo(-6, 4);
                  ctx.closePath();
                  ctx.fillStyle = '#000';
                  ctx.shadowColor = 'rgba(0,0,0,0.3)';
                  ctx.shadowBlur = 4;
                  ctx.fill();
                  ctx.restore();

                  // center pin
                  ctx.beginPath();
                  ctx.arc(cx, cy, 5, 0, Math.PI * 2);
                  ctx.fillStyle = '#000';
                  ctx.fill();
              }
          }]
      });
  </script>

  <!-- CURRENT MONTH TARGET ACHIEVED script -->
  <script>
    const ctxTarget = document.getElementById('targetGauge').getContext('2d');

    const target = 1000000;
    const achieved = <?= json_encode($commissionMonth) ?>;
    const achievedPercent = (achieved / target) * 100;

    new Chart(ctxTarget, {
      type: 'doughnut',
      data: {
        labels: ['Achieved', 'Remaining'],
        datasets: [{
          data: [achievedPercent, 100 - achievedPercent],
          backgroundColor: ['#28a745', '#e9ecef'],
          borderWidth: 0,
          needleValue: achievedPercent
        }]
      },
      options: {
        responsive: false,
        maintainAspectRatio: false,
        rotation: -90,
        circumference: 180,
        cutout: '70%',
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: function (ctx) {
                return ctx.label + ': ' + Math.round(ctx.raw) + '%';
              }
            }
          }
        },
        animation: { duration: 0 }
      },
      plugins: [{
        id: 'needle',
        afterDatasetDraw(chart) {
          const needleValue = chart.config.data.datasets[0].needleValue;
          const angle = Math.PI * (needleValue / 100);
          const cx = chart.width / 2;
          const cy = chart._metasets[0].data[0].y;
          const r = chart._metasets[0].data[0].outerRadius;
          const needleLength = r - 5;

          const ctx = chart.ctx;
          ctx.save();
          ctx.translate(cx, cy);
          ctx.rotate(angle - Math.PI);
          ctx.beginPath();
          ctx.moveTo(-6, -4);
          ctx.lineTo(needleLength, 0);
          ctx.lineTo(-6, 4);
          ctx.closePath();
          ctx.fillStyle = '#000';
          ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
          ctx.shadowBlur = 4;
          ctx.fill();
          ctx.restore();

          // Center pin
          ctx.beginPath();
          ctx.arc(cx, cy, 5, 0, Math.PI * 2);
          ctx.fillStyle = '#000';
          ctx.fill();
        }
      }]
    });
  </script>


<!-- Custom Date Range Modal -->
<div class="modal fade" id="customDateModal" tabindex="-1" aria-labelledby="customDateLabel" aria-hidden="true">
  <div class="modal-dialog modal-dialog-centered">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title" id="customDateLabel">Select Custom Date Range</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div class="modal-body text-start">
        <label for="dateRange" class="form-label">Date Range</label>
        <input type="text" id="dateRange" class="form-control" placeholder="Choose date range" />
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary btn-sm" data-bs-dismiss="modal">Cancel</button>
        <button type="button" class="btn btn-primary btn-sm" id="applyCustomDate">Apply</button>
      </div>
    </div>
  </div>
</div>
<!-- Custom Date Picker script -->
<script>
  flatpickr("#dateRange", {
    mode: "range",
    dateFormat: "Y-m-d"
  });

  document.getElementById("applyCustomDate").addEventListener("click", function () {
    const selectedRange = document.getElementById("dateRange").value;
    if (selectedRange) {
      const [startDate, endDate] = selectedRange.split(" to ");
      console.log("Custom Range Selected:", startDate, endDate);

      // Update dropdown button label
      const dropdownBtn = document.getElementById("searchDropdownBtn");
      dropdownBtn.innerHTML = `Custom: ${startDate} to ${endDate} <i class="bi bi-caret-down-fill ms-1"></i>`;

      // Close modal
      const modal = bootstrap.Modal.getInstance(document.getElementById('customDateModal'));
      modal.hide();
    }
  });
</script>
<!-- Reset search values  -->
<script>
  document.querySelectorAll(".dropdown-menu .dropdown-item").forEach(function (item) {
    item.addEventListener("click", function () {
      if (!this.textContent.includes("Custom")) {
        document.getElementById("searchDropdownBtn").innerHTML = this.textContent + ` <i class="bi bi-caret-down-fill ms-1"></i>`;
      }
    });
  });
</script>
<!-- Script for Sale type commission graph  -->
<script>

</script>

  <script>

      document.addEventListener('DOMContentLoaded', function () {
          var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
          tooltipTriggerList.map(function (el) {
              return new bootstrap.Tooltip(el)
          })
      });
  </script>

    <script>
        const el = document.getElementById('topUsersCarousel');
        const bs = new bootstrap.Carousel(el, {
            interval: false,
            ride: false,
            touch: true,
            wrap: true
        });

        let startX = 0, deltaX = 0, dragging = false, pointerId = null;
        const THRESHOLD = 40;

        const onDown = (e) => {
            dragging = true;
            pointerId = e.pointerId;
            startX = e.clientX;
            deltaX = 0;
            el.setPointerCapture(pointerId);
        };

        const onMove = (e) => {
            if (!dragging) return;
            deltaX = e.clientX - startX;
        };

        const onUp = () => {
            if (!dragging) return;
            if (Math.abs(deltaX) > THRESHOLD) {
                (deltaX < 0 ? bs.next() : bs.prev());
            }
            dragging = false;
            deltaX = 0;
            if (pointerId !== null) {
                try { el.releasePointerCapture(pointerId); } catch(e){}
                pointerId = null;
            }
        };

        el.addEventListener('pointerdown', onDown);
        el.addEventListener('pointermove', onMove);
        el.addEventListener('pointerup', onUp);
        el.addEventListener('pointercancel', onUp);
        el.addEventListener('pointerleave', onUp);
    </script>


    <script>
      (function(){
          const el = document.getElementById('hotLeaderCarousel');
          if(!el) return;
          el.addEventListener('slid.bs.carousel', function (e) {
              const idx = e.to; // Bootstrap 5 gives the new index
              document.querySelectorAll('.ctrl-dot').forEach((b,i)=>{
                  b.classList.toggle('active', i===idx);
              });
          });
      })();
  </script>

  <script>
      document.addEventListener('DOMContentLoaded', () => {
          const carouselEl = document.getElementById('hotListingsCarousel');
          const itemEls = Array.from(carouselEl.querySelectorAll('.carousel-item'));
          const dotEls = Array.from(carouselEl.querySelectorAll('.ctrl-dots .pager-btn'));
          if (!carouselEl || dotEls.length === 0) return;

          const carousel = new bootstrap.Carousel(carouselEl, { interval: 5000, pause: 'hover' });

          carouselEl.addEventListener('slid.bs.carousel', () => {
              const activeIndex = itemEls.findIndex(el => el.classList.contains('active'));
              dotEls.forEach((btn, i) => {
                  btn.classList.toggle('btn-success', i === activeIndex);
                  btn.classList.toggle('btn-outline-success', i !== activeIndex);
              });
          });
      });
  </script>
  <!-- last line -->
</div>
</html>

<?php

require($_SERVER["DOCUMENT_ROOT"]."/bitrix/footer.php");

?>