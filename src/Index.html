<!DOCTYPE html>
<html>
<head>
  <base target="_top">

  <meta
    name="viewport"
    content="width=device-width, initial-scale=1"
  >

  <style>
    :root {
      --primary: #315f81;
      --primary-dark: #244860;
      --background: #f3f5f7;
      --surface: #ffffff;
      --border: #d8dee4;
      --text: #202124;
      --secondary: #5f6368;
      --action-bg: #fff4e5;
      --action-border: #f5c26b;
      --info-bg: #eaf3ff;
      --info-border: #9cc2ef;
      --error-bg: #fce8e6;
      --error-text: #a50e0e;
    }

    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      background: var(--background);
      color: var(--text);
      font-family:
        Arial,
        "Noto Sans JP",
        sans-serif;
    }

    button {
      font: inherit;
    }

    .page {
      width: min(100%, 920px);
      margin: 0 auto;
      padding: 18px;
    }

    .header {
      padding: 24px 28px;
      border-radius: 14px;
      background: var(--primary);
      color: white;
    }

    .header h1 {
      margin: 0 0 6px;
      font-size: 28px;
    }

    .header p {
      margin: 0;
      opacity: 0.92;
    }

    .navigation {
      display: flex;
      gap: 8px;
      margin: 14px 0 20px;
      overflow-x: auto;
      padding-bottom: 3px;
    }

    .nav-button {
      flex: 0 0 auto;
      padding: 10px 14px;
      border: 1px solid var(--border);
      border-radius: 20px;
      background: white;
      color: var(--primary-dark);
      cursor: pointer;
      font-weight: bold;
    }

    .nav-button.active {
      border-color: var(--primary);
      background: var(--primary);
      color: white;
    }

    .card {
      margin-bottom: 16px;
      padding: 20px;
      border: 1px solid var(--border);
      border-radius: 13px;
      background: var(--surface);
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
    }

    .user-name {
      margin: 0 0 6px;
      font-size: 22px;
    }

    .user-details,
    .session-details {
      margin: 0;
      color: var(--secondary);
      line-height: 1.6;
    }

    .section-title {
      margin: 25px 0 12px;
      font-size: 21px;
    }

    .notification {
      margin-bottom: 10px;
      padding: 14px 16px;
      border: 1px solid;
      border-radius: 10px;
    }

    .notification.action {
      border-color: var(--action-border);
      background: var(--action-bg);
    }

    .notification.information {
      border-color: var(--info-border);
      background: var(--info-bg);
    }

    .notification-title {
      margin: 0 0 5px;
      font-weight: bold;
    }

    .notification-message {
      margin: 0;
      line-height: 1.5;
    }

    .notification-date {
      margin-top: 5px;
      color: var(--secondary);
      font-size: 13px;
    }

    .session-date {
      margin-bottom: 5px;
      color: var(--primary);
      font-size: 14px;
      font-weight: bold;
    }

    .session-title {
      margin: 0 0 8px;
      font-size: 19px;
    }

    .session-type {
      display: inline-block;
      margin-top: 12px;
      padding: 4px 9px;
      border-radius: 20px;
      background: #e8f0fe;
      color: #174ea6;
      font-size: 12px;
      font-weight: bold;
    }

    .notes {
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid var(--border);
      line-height: 1.5;
    }

    .loading {
      padding: 50px 20px;
      text-align: center;
      color: var(--secondary);
    }

    .empty {
      color: var(--secondary);
      text-align: center;
    }

    .error {
      margin-top: 20px;
      padding: 20px;
      border-radius: 10px;
      background: var(--error-bg);
      color: var(--error-text);
      line-height: 1.5;
    }

    .hidden {
      display: none;
    }

    @media (max-width: 600px) {
      .page {
        padding: 11px;
      }

      .header,
      .card {
        padding: 17px;
      }

      .header h1 {
        font-size: 24px;
      }
    }
    .availability-card {
  position: relative;
}

.current-status {
  display: inline-block;
  margin-top: 12px;
  padding: 5px 10px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: bold;
}

.current-status.available {
  background: #e6f4ea;
  color: #137333;
}

.current-status.unavailable {
  background: #fce8e6;
  color: #a50e0e;
}

.current-status.unsure {
  background: #fef7e0;
  color: #8a5a00;
}

.current-status.no-response {
  background: #eef0f2;
  color: #5f6368;
}

.response-options {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-top: 18px;
}

.response-option {
  position: relative;
}

.response-option input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.response-option label {
  display: block;
  min-height: 48px;
  padding: 13px 8px;
  border: 2px solid var(--border);
  border-radius: 9px;
  background: white;
  text-align: center;
  cursor: pointer;
  font-weight: bold;
}

.response-option input:checked + label {
  border-color: var(--primary);
  background: #eaf3ff;
  color: var(--primary-dark);
}

.response-option input:focus + label {
  outline: 3px solid rgba(49, 95, 129, 0.2);
  outline-offset: 2px;
}

.form-label {
  display: block;
  margin: 18px 0 7px;
  font-weight: bold;
}

.form-help {
  margin: 5px 0 0;
  color: var(--secondary);
  font-size: 13px;
  line-height: 1.4;
}

.note-input {
  width: 100%;
  min-height: 76px;
  padding: 11px;
  border: 1px solid var(--border);
  border-radius: 8px;
  resize: vertical;
  font: inherit;
}

.note-input:focus {
  border-color: var(--primary);
  outline: 3px solid rgba(49, 95, 129, 0.15);
}

.form-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 15px;
}

.primary-button {
  padding: 11px 18px;
  border: 0;
  border-radius: 8px;
  background: var(--primary);
  color: white;
  cursor: pointer;
  font-weight: bold;
}

.primary-button:hover {
  background: var(--primary-dark);
}

.primary-button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.save-message {
  color: #137333;
  font-size: 14px;
  font-weight: bold;
}

.save-message.error-message {
  color: var(--error-text);
}

.private-note {
  margin-top: 10px;
  color: var(--secondary);
  font-size: 13px;
}

.updated-time {
  margin-top: 10px;
  color: var(--secondary);
  font-size: 12px;
}

.availability-loading {
  padding: 35px;
  color: var(--secondary);
  text-align: center;
}

.character-count {
  margin-top: 4px;
  color: var(--secondary);
  font-size: 12px;
  text-align: right;
}

@media (max-width: 600px) {
  .response-options {
    grid-template-columns: 1fr;
  }

  .response-option label {
    min-height: auto;
    padding: 11px;
  }

  .form-actions {
    align-items: stretch;
    flex-direction: column;
  }

  .primary-button {
    width: 100%;
  }
}
.dashboard-date {
  margin: 0 0 5px;
  color: var(--secondary);
  font-size: 14px;
  font-weight: bold;
}

.dashboard-session-heading {
  margin: 0;
  font-size: 25px;
}

.dashboard-session-meta {
  margin: 8px 0 0;
  color: var(--secondary);
  line-height: 1.6;
}

.session-selector {
  width: 100%;
  margin-top: 16px;
  padding: 11px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: white;
  font: inherit;
}

.summary-grid {
  display: grid;
  grid-template-columns:
    repeat(auto-fit, minmax(135px, 1fr));
  gap: 10px;
  margin-bottom: 20px;
}

.summary-card {
  min-height: 105px;
  padding: 16px;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: white;
  text-align: center;
}

.summary-number {
  display: block;
  margin-bottom: 5px;
  color: var(--primary);
  font-size: 32px;
  font-weight: bold;
}

.summary-label {
  color: var(--secondary);
  font-size: 14px;
  line-height: 1.35;
}

.summary-card.attention {
  border-color: #f5c26b;
  background: #fff8e8;
}

.summary-card.problem {
  border-color: #e6a09a;
  background: #fceeed;
}

.summary-card.positive {
  border-color: #9bc7a5;
  background: #edf7ef;
}

.dashboard-group {
  margin-bottom: 17px;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: white;
  overflow: hidden;
}

.dashboard-group-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 17px;
  background: #f7f8f9;
  cursor: pointer;
}

.dashboard-group-title {
  margin: 0;
  font-size: 17px;
}

.dashboard-count {
  min-width: 30px;
  padding: 4px 8px;
  border-radius: 20px;
  background: #e8edf1;
  text-align: center;
  font-size: 13px;
  font-weight: bold;
}

.member-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.member-row {
  padding: 14px 17px;
  border-top: 1px solid var(--border);
}

.member-row:first-child {
  border-top: 0;
}

.member-name {
  font-weight: bold;
}

.member-meta {
  margin-top: 4px;
  color: var(--secondary);
  font-size: 13px;
  line-height: 1.5;
}

.member-reason {
  margin-top: 7px;
  padding: 8px 10px;
  border-radius: 7px;
  background: #f5f6f7;
  font-size: 13px;
  line-height: 1.45;
}

.conflict-box {
  margin-bottom: 18px;
  padding: 16px;
  border: 1px solid #e6a09a;
  border-radius: 11px;
  background: #fceeed;
}

.conflict-box h3 {
  margin: 0 0 8px;
  color: #a50e0e;
  font-size: 17px;
}

.dashboard-empty {
  padding: 30px 20px;
  text-align: center;
  color: var(--secondary);
}

.dashboard-refresh-row {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 12px;
}

.secondary-button {
  padding: 9px 14px;
  border: 1px solid var(--primary);
  border-radius: 8px;
  background: white;
  color: var(--primary);
  cursor: pointer;
  font-weight: bold;
}

.secondary-button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

@media (max-width: 600px) {
  .summary-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .summary-card {
    min-height: 95px;
    padding: 13px 8px;
  }

  .summary-number {
    font-size: 27px;
  }
}
  </style>
</head>

<body>
  <main class="page">
    <header class="header">
      <h1>中高YWCA</h1>
      <p>出席、訪問</p>
    </header>

    <nav
      id="navigation"
      class="navigation hidden"
      aria-label="Club Portal sections"
    ></nav>

    <div id="content" class="loading">
      クラブ情報を読み込んでいます… Loading your club information… 
    </div>
  </main>

  <script>
    let portalData = null;

    document.addEventListener(
      'DOMContentLoaded',
      loadPortal
    );

    function loadPortal() {
      google.script.run
        .withSuccessHandler(initialisePortal)
        .withFailureHandler(renderError)
        .getPortalData();
    }

    function initialisePortal(data) {
      portalData = data;

      renderNavigation(data.permissions);
      renderHome();
    }

    function renderNavigation(permissions) {
      const navigation =
        document.getElementById('navigation');

      const items = [
        { id: 'home', label: 'ホーム' },
        { id: 'availability', label: '可用性' },
        { id: 'volunteer', label: '訪問スケジュール' },
        { id: 'attendance', label: 'チェックイン' }
      ];

      if (permissions.canViewDashboard) {
        items.push({
          id: 'dashboard',
          label: 'ダッシュボード'
        });
      }

      navigation.innerHTML = items.map(item => `
        <button
          class="nav-button ${item.id === 'home' ? 'active' : ''}"
          data-view="${escapeHtml(item.id)}"
          type="button"
        >
          ${escapeHtml(item.label)}
        </button>
      `).join('');

      navigation.classList.remove('hidden');

      navigation
        .querySelectorAll('.nav-button')
        .forEach(button => {
          button.addEventListener('click', () => {
            selectView(button.dataset.view);
          });
        });
    }

    function selectView(view) {
      document
        .querySelectorAll('.nav-button')
        .forEach(button => {
          button.classList.toggle(
            'active',
            button.dataset.view === view
          );
        });

      switch (view) {
        case 'home':
          renderHome();
          break;

        case 'availability':
  renderAvailability();
  break;

        case 'volunteer':
          renderPlaceholder(
            '訪問スケジュール',
            'Personal volunteer assignments will appear here.'
          );
          break;

        case 'attendance':
          renderPlaceholder(
            'Check In',
            'QR and same-day attendance check-in will appear here.'
          );
          break;

        case 'dashboard':
  renderDashboard();
  break;
      }
    }

    function renderHome() {
      const content =
        document.getElementById('content');

      const user = portalData.user;
      const notifications =
        portalData.notifications || [];
      const sessions =
        portalData.sessions || [];

      let html = `
        <section class="card">
          <h2 class="user-name">
            ようこそ, ${escapeHtml(user.name)}
          </h2>

          <p class="user-details">
            ${escapeHtml(user.role)}
            ${user.grade
              ? ` · ${escapeHtml(user.grade)}`
              : ''}
            <br>
            ${escapeHtml(user.email)}
          </p>
        </section>

        <h2 class="section-title">
          通知
        </h2>
      `;

      if (notifications.length === 0) {
        html += `
          <section class="card empty">
            通知はありません。
          </section>
        `;
      } else {
        notifications.forEach(notification => {
          html += `
            <article
              class="notification
                ${escapeHtml(notification.priority)}"
            >
              <p class="notification-title">
                ${escapeHtml(notification.title)}
              </p>

              <p class="notification-message">
                ${escapeHtml(notification.message)}
              </p>

              <div class="notification-date">
                ${escapeHtml(notification.date)}
              </div>
            </article>
          `;
        });
      }

      html += `
        <h2 class="section-title">
          今後の日程
        </h2>
      `;

      if (sessions.length === 0) {
        html += `
          <section class="card empty">
            今後予定されているセッションは掲載されていません。
          </section>
        `;
      } else {
        sessions.forEach(session => {
          const timeText = buildTimeText(
            session.startTime,
            session.endTime
          );

          html += `
            <section class="card">
              <div class="session-date">
                ${escapeHtml(session.date)}
              </div>

              <h3 class="session-title">
                ${escapeHtml(session.title)}
              </h3>

              <p class="session-details">
                ${timeText
                  ? escapeHtml(timeText)
                  : 'Time not specified'}
              </p>

              <span class="session-type">
                ${escapeHtml(session.sessionType)}
              </span>

              ${session.responseDeadline
                ? `
                  <p
                    class="session-details"
                    style="margin-top: 12px;"
                  >
                    Response deadline:
                    ${escapeHtml(
                      session.responseDeadline
                    )}
                  </p>
                `
                : ''}

              ${session.notes
                ? `
                  <div class="notes">
                    ${escapeHtml(session.notes)}
                  </div>
                `
                : ''}
            </section>
          `;
        });
      }

      content.className = '';
      content.innerHTML = html;
    }
function renderAvailability() {
  const content =
    document.getElementById('content');

  content.className = '';
  content.innerHTML = `
    <h2 class="section-title">
      対応可能日時
    </h2>

    <section class="card availability-loading">
      空き状況を読み込んでいます…
    </section>
  `;

  google.script.run
    .withSuccessHandler(renderAvailabilityData)
    .withFailureHandler(renderAvailabilityError)
    .getAvailabilityPageData();
}


function renderAvailabilityData(data) {
  const content =
    document.getElementById('content');

  const sessions = data.sessions || [];

  let html = `
    <h2 class="section-title">
      対応可能日時
    </h2>

    <section class="card">
      <p style="margin: 0; line-height: 1.6;">
        今後の各ミーティングやイベントに出席できるかどうかをクラブにお知らせください。入力した内容は、クラブのリーダーと指導者のみが閲覧できます。
      </p>
    </section>
  `;

  if (sessions.length === 0) {
    html += `
      <section class="card empty">
        回答が必要な今後のセッションはありません。
      </section>
    `;

    content.innerHTML = html;
    return;
  }

  sessions.forEach(session => {
    html += buildAvailabilityCard(session);
  });

  content.innerHTML = html;

  sessions.forEach(session => {
    initialiseAvailabilityCard(session.sessionId);
  });
}


function buildAvailabilityCard(session) {
  const availability =
    session.availability || {};

  const response =
    availability.response || '';

  const status = getStatusDisplay(response);

  const timeText = buildTimeText(
    session.startTime,
    session.endTime
  );

  const safeSessionId =
    escapeHtml(session.sessionId);

  return `
    <section
      class="card availability-card"
      id="availability-card-${safeSessionId}"
      data-session-id="${safeSessionId}"
    >
      <div class="session-date">
        ${escapeHtml(session.date)}
      </div>

      <h3 class="session-title">
        ${escapeHtml(session.title)}
      </h3>

      <p class="session-details">
        ${timeText
          ? escapeHtml(timeText)
          : '時間は指定されていません'}
      </p>

      <span
        id="status-${safeSessionId}"
        class="current-status ${status.className}"
      >
        ${escapeHtml(status.label)}
      </span>

      ${session.responseDeadline
        ? `
          <p
            class="session-details"
            style="margin-top: 12px;"
          >
            Response deadline:
            ${escapeHtml(session.responseDeadline)}
          </p>
        `
        : ''}

      <div
        class="response-options"
        role="radiogroup"
       aria-label="${escapeHtml(
  `${session.title}の参加可否`
)}"
      >
        ${buildResponseOption(
          session.sessionId,
          'Available',
          '参加可能',
          response
        )}

        ${buildResponseOption(
          session.sessionId,
          'Unavailable',
          '参加不可',
          response
        )}

        ${buildResponseOption(
          session.sessionId,
          'Unsure',
          '未定',
          response
        )}
      </div>

      <label
        class="form-label"
        for="reason-${safeSessionId}"
      >
        個人メモ
      </label>

      <textarea
        class="note-input"
        id="reason-${safeSessionId}"
        maxlength="500"
        placeholder="例：歯医者の予約"
      >${escapeHtml(availability.reason || '')}</textarea>

      <p class="form-help">
        このメモは任意です。他の生徒には表示されません。
      </p>

      <div
        class="character-count"
        id="count-${safeSessionId}"
      >
        ${(availability.reason || '').length}/500
      </div>

      <div class="form-actions">
        <button
          class="primary-button"
          id="save-${safeSessionId}"
          type="button"
        >
          回答を保存
        </button>

        <span
          class="save-message"
          id="message-${safeSessionId}"
          role="status"
          aria-live="polite"
        ></span>
      </div>

      ${availability.updatedAt
        ? `
          <div
            class="updated-time"
            id="updated-${safeSessionId}"
          >
            Last updated:
            ${escapeHtml(availability.updatedAt)}
          </div>
        `
        : `
          <div
            class="updated-time"
            id="updated-${safeSessionId}"
          ></div>
        `}

      ${session.notes
        ? `
          <div class="notes">
            ${escapeHtml(session.notes)}
          </div>
        `
        : ''}
    </section>
  `;
}


function buildResponseOption(
  sessionId,
  value,
  label,
  currentResponse
) {
  const inputId =
    `response-${sessionId}-${value}`;

  const checked =
    currentResponse === value
      ? 'checked'
      : '';

  return `
    <div class="response-option">
      <input
        type="radio"
        id="${escapeHtml(inputId)}"
        name="response-${escapeHtml(sessionId)}"
        value="${escapeHtml(value)}"
        ${checked}
      >

      <label for="${escapeHtml(inputId)}">
        ${escapeHtml(label)}
      </label>
    </div>
  `;
}


function initialiseAvailabilityCard(sessionId) {
  const saveButton =
    document.getElementById(`save-${sessionId}`);

  const noteInput =
    document.getElementById(`reason-${sessionId}`);

  if (!saveButton || !noteInput) {
    return;
  }

  saveButton.addEventListener('click', () => {
    submitAvailability(sessionId);
  });

  noteInput.addEventListener('input', () => {
    const count =
      document.getElementById(`count-${sessionId}`);

    if (count) {
      count.textContent =
        `${noteInput.value.length}/500`;
    }
  });
}


function submitAvailability(sessionId) {
  const selectedResponse =
    document.querySelector(
      `input[name="response-${cssEscape(sessionId)}"]:checked`
    );

  const reasonInput =
    document.getElementById(`reason-${sessionId}`);

  const saveButton =
    document.getElementById(`save-${sessionId}`);

  const message =
    document.getElementById(`message-${sessionId}`);

  if (!selectedResponse) {
    message.textContent =
      'Please select a response.';

    message.classList.add('error-message');
    return;
  }

  message.textContent = '';
  message.classList.remove('error-message');

  saveButton.disabled = true;
  saveButton.textContent = 'Saving…';

  google.script.run
    .withSuccessHandler(result => {
      handleAvailabilitySaved(
        result,
        sessionId
      );
    })
    .withFailureHandler(error => {
      handleAvailabilitySaveError(
        error,
        sessionId
      );
    })
    .saveAvailability({
      sessionId: sessionId,
      response: selectedResponse.value,
      reason: reasonInput.value
    });
}


function handleAvailabilitySaved(
  result,
  sessionId
) {
  const saveButton =
    document.getElementById(`save-${sessionId}`);

  const message =
    document.getElementById(`message-${sessionId}`);

  const status =
    document.getElementById(`status-${sessionId}`);

  const updated =
    document.getElementById(`updated-${sessionId}`);

  const statusDisplay =
    getStatusDisplay(result.response);

  saveButton.disabled = false;
  saveButton.textContent = 'Save response';

  message.classList.remove('error-message');
  message.textContent = result.message;

  status.className =
    `current-status ${statusDisplay.className}`;

  status.textContent =
    statusDisplay.label;

  updated.textContent =
    `Last updated: ${result.updatedAt}`;

  /*
   * Refresh the cached portal information so the Home
   * notifications are correct when the student returns.
   */
  google.script.run
    .withSuccessHandler(data => {
      portalData = data;
    })
    .withFailureHandler(() => {
      // The availability has already saved successfully,
      // so a background refresh failure can be ignored.
    })
    .getPortalData();
}


function handleAvailabilitySaveError(
  error,
  sessionId
) {
  const saveButton =
    document.getElementById(`save-${sessionId}`);

  const message =
    document.getElementById(`message-${sessionId}`);

  saveButton.disabled = false;
  saveButton.textContent = 'Save response';

  message.classList.add('error-message');
  message.textContent =
    error && error.message
      ? error.message
      : 'The response could not be saved.';
}


function renderAvailabilityError(error) {
  const content =
    document.getElementById('content');

  content.innerHTML = `
    <h2 class="section-title">
      My Availability
    </h2>

    <section class="error">
      ${escapeHtml(
        error && error.message
          ? error.message
          : 'Availability could not be loaded.'
      )}
    </section>
  `;
}


function getStatusDisplay(response) {
  switch (response) {
    case 'Available':
      return {
        label: 'Available',
        className: 'available'
      };

    case 'Unavailable':
      return {
        label: 'Unavailable',
        className: 'unavailable'
      };

    case 'Unsure':
      return {
        label: 'Unsure',
        className: 'unsure'
      };

    default:
      return {
        label: 'No response',
        className: 'no-response'
      };
  }
}


/**
 * Escapes a value used in a CSS selector.
 * Modern browsers support CSS.escape, but this fallback
 * handles Apps Script web-app browsers as well.
 */
function cssEscape(value) {
  if (
    window.CSS &&
    typeof window.CSS.escape === 'function'
  ) {
    return window.CSS.escape(value);
  }

  return String(value)
    .replace(/[^a-zA-Z0-9_-]/g, '\\$&');
}
function renderDashboard() {
  const content =
    document.getElementById('content');

  content.className = '';
  content.innerHTML = `
    <h2 class="section-title">
      Management Dashboard
    </h2>

    <section class="card availability-loading">
      Loading today's information…
    </section>
  `;

  google.script.run
    .withSuccessHandler(renderDashboardData)
    .withFailureHandler(renderDashboardError)
    .getDashboardData();
}


function renderDashboardData(data) {
  const content =
    document.getElementById('content');

  const sessions = data.sessions || [];

  if (sessions.length === 0) {
    content.innerHTML = `
      <h2 class="section-title">
        Management Dashboard
      </h2>

      <section class="card">
        <p class="dashboard-date">
          ${escapeHtml(data.todayLabel)}
        </p>

        <div class="dashboard-empty">
          There is no active club session scheduled
          for today.
        </div>
      </section>
    `;

    return;
  }

  let selector = '';

  if (sessions.length > 1) {
    selector = `
      <label
        class="form-label"
        for="dashboard-session-selector"
      >
        Today's session
      </label>

      <select
        id="dashboard-session-selector"
        class="session-selector"
      >
        ${sessions.map(session => `
          <option
            value="${escapeHtml(session.sessionId)}"
          >
            ${escapeHtml(session.title)}
            ${session.startTime
              ? ` — ${escapeHtml(session.startTime)}`
              : ''}
          </option>
        `).join('')}
      </select>
    `;
  }

  content.innerHTML = `
    <h2 class="section-title">
      Management Dashboard
    </h2>

    <section class="card">
      <p class="dashboard-date">
        ${escapeHtml(data.todayLabel)}
      </p>

      ${selector}
    </section>

    <div id="dashboard-session-content"></div>
  `;

  if (sessions.length > 1) {
    const selectorElement =
      document.getElementById(
        'dashboard-session-selector'
      );

    selectorElement.addEventListener(
      'change',
      () => {
        loadDashboardSession(
          selectorElement.value
        );
      }
    );
  }

  renderDashboardSession(
    data.selectedSession
  );
}


function loadDashboardSession(sessionId) {
  const container =
    document.getElementById(
      'dashboard-session-content'
    );

  container.innerHTML = `
    <section class="card availability-loading">
      Loading session information…
    </section>
  `;

  google.script.run
    .withSuccessHandler(renderDashboardSession)
    .withFailureHandler(renderDashboardError)
    .getDashboardSession(sessionId);
}


function renderDashboardSession(data) {
  const container =
    document.getElementById(
      'dashboard-session-content'
    );

  if (!container || !data) {
    return;
  }

  const session = data.session;
  const summary = data.summary;
  const groups = data.groups;

  const timeText = buildTimeText(
    session.startTime,
    session.endTime
  );

  let html = `
    <section class="card">
      <h2 class="dashboard-session-heading">
        ${escapeHtml(session.title)}
      </h2>

      <p class="dashboard-session-meta">
        ${escapeHtml(session.date)}
        ${timeText
          ? `<br>${escapeHtml(timeText)}`
          : ''}
      </p>

      ${session.notes
        ? `
          <div class="notes">
            ${escapeHtml(session.notes)}
          </div>
        `
        : ''}
    </section>

    <div class="dashboard-refresh-row">
      <button
        type="button"
        class="secondary-button"
        id="refresh-dashboard-button"
      >
        Refresh
      </button>
    </div>

    <section class="summary-grid">
      ${buildSummaryCard(
        summary.activeMembers,
        'Active members',
        ''
      )}

      ${buildSummaryCard(
        summary.available,
        'Available',
        'positive'
      )}

      ${buildSummaryCard(
        summary.volunteers,
        'Volunteers',
        'positive'
      )}

      ${buildSummaryCard(
        summary.unavailable,
        'Unavailable',
        summary.unavailable > 0
          ? 'problem'
          : ''
      )}

      ${buildSummaryCard(
        summary.unsure,
        'Unsure',
        summary.unsure > 0
          ? 'attention'
          : ''
      )}

      ${buildSummaryCard(
        summary.noResponse,
        'No response',
        summary.noResponse > 0
          ? 'attention'
          : ''
      )}
    </section>
  `;

  if (
    groups.conflicts &&
    groups.conflicts.length > 0
  ) {
    html += buildConflictBox(groups.conflicts);
  }

  html += buildDashboardGroup(
    'Scheduled volunteers',
    groups.volunteers,
    'volunteer'
  );

  html += buildDashboardGroup(
    'Available for club',
    groups.available,
    'available'
  );

  html += buildDashboardGroup(
    'Unavailable',
    groups.unavailable,
    'unavailable'
  );

  html += buildDashboardGroup(
    'Unsure',
    groups.unsure,
    'unsure'
  );

  html += buildDashboardGroup(
    'No response',
    groups.noResponse,
    'no-response'
  );

  html += `
    <h2 class="section-title">
      Attendance
    </h2>

    <section class="card">
      <p style="margin: 0; line-height: 1.6;">
        Attendance has been recorded for
        <strong>${summary.attendanceRecorded}</strong>
        of
        <strong>${summary.expected}</strong>
        expected members.
      </p>

      <p
        class="session-details"
        style="margin-top: 8px;"
      >
        This section will update automatically once
        manual or QR check-in is added.
      </p>
    </section>
  `;

  container.innerHTML = html;

  const refreshButton =
    document.getElementById(
      'refresh-dashboard-button'
    );

  if (refreshButton) {
    refreshButton.addEventListener('click', () => {
      refreshButton.disabled = true;
      refreshButton.textContent = 'Refreshing…';

      loadDashboardSession(session.sessionId);
    });
  }
}


function buildSummaryCard(
  number,
  label,
  className
) {
  return `
    <div class="summary-card ${escapeHtml(
      className || ''
    )}">
      <span class="summary-number">
        ${escapeHtml(number)}
      </span>

      <span class="summary-label">
        ${escapeHtml(label)}
      </span>
    </div>
  `;
}


function buildDashboardGroup(
  title,
  members,
  type
) {
  const list = members || [];

  return `
    <section class="dashboard-group">
      <div class="dashboard-group-header">
        <h3 class="dashboard-group-title">
          ${escapeHtml(title)}
        </h3>

        <span class="dashboard-count">
          ${list.length}
        </span>
      </div>

      ${list.length === 0
        ? `
          <div class="dashboard-empty">
            No students in this category.
          </div>
        `
        : `
          <ul class="member-list">
            ${list.map(member =>
              buildDashboardMember(member, type)
            ).join('')}
          </ul>
        `}
    </section>
  `;
}


function buildDashboardMember(member, type) {
  let details = [];

  if (member.grade) {
    details.push(member.grade);
  }

  if (type === 'volunteer' && member.volunteer) {
    if (member.volunteer.activity) {
      details.push(member.volunteer.activity);
    }

    if (member.volunteer.location) {
      details.push(member.volunteer.location);
    }

    if (member.volunteer.departureTime) {
      details.push(
        `Leave ${member.volunteer.departureTime}`
      );
    }
  }

  return `
    <li class="member-row">
      <div class="member-name">
        ${escapeHtml(member.name)}
      </div>

      ${details.length > 0
        ? `
          <div class="member-meta">
            ${details
              .map(escapeHtml)
              .join(' · ')}
          </div>
        `
        : ''}

      ${member.reason
        ? `
          <div class="member-reason">
            ${escapeHtml(member.reason)}
          </div>
        `
        : ''}
    </li>
  `;
}


function buildConflictBox(conflicts) {
  return `
    <section class="conflict-box">
      <h3>Volunteer assignment conflict</h3>

      <p style="margin: 0 0 10px; line-height: 1.5;">
        The following students are assigned to volunteer
        but have marked themselves unavailable:
      </p>

      <ul style="margin-bottom: 0;">
        ${conflicts.map(member => `
          <li>
            <strong>
              ${escapeHtml(member.name)}
            </strong>
            ${member.reason
              ? ` — ${escapeHtml(member.reason)}`
              : ''}
          </li>
        `).join('')}
      </ul>
    </section>
  `;
}


function renderDashboardError(error) {
  const content =
    document.getElementById('content');

  content.className = '';
  content.innerHTML = `
    <h2 class="section-title">
      Management Dashboard
    </h2>

    <section class="error">
      ${escapeHtml(
        error && error.message
          ? error.message
          : 'The dashboard could not be loaded.'
      )}
    </section>
  `;
}
    function renderPlaceholder(title, message) {
      const content =
        document.getElementById('content');

      content.className = '';
      content.innerHTML = `
        <h2 class="section-title">
          ${escapeHtml(title)}
        </h2>

        <section class="card empty">
          ${escapeHtml(message)}
        </section>
      `;
    }

    function renderError(error) {
      const content =
        document.getElementById('content');

      content.className = 'error';
      content.textContent =
        error && error.message
          ? error.message
          : 'The Club Portal could not be loaded.';
    }

    function buildTimeText(startTime, endTime) {
      if (startTime && endTime) {
        return `${startTime}–${endTime}`;
      }

      return startTime || endTime || '';
    }

    function escapeHtml(value) {
      return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }
  </script>
</body>
</html>
