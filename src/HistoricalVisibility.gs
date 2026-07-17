const HISTORY_SCOPES_ = Object.freeze({
  CURRENT_SCHOOL_YEAR: 'currentSchoolYear',
  ARCHIVE: 'archive',
  CUSTOM: 'custom'
});


/**
 * Returns the Japanese school year containing the supplied Tokyo date.
 * The school year begins on 1 April and ends on 31 March.
 *
 * @param {string=} referenceDateValue
 * @return {Object}
 */
function getCurrentJapaneseSchoolYearRange_(referenceDateValue) {
  const dateValue = getDateOnlyValue_(
    referenceDateValue || getTodayDateValue_()
  );

  if (!dateValue) {
    throw new Error('The school-year reference date is invalid.');
  }

  const year = Number(dateValue.slice(0, 4));
  const month = Number(dateValue.slice(5, 7));
  const startYear = month >= 4 ? year : year - 1;

  return {
    fromDateValue: `${startYear}-04-01`,
    toDateValue: `${startYear + 1}-03-31`
  };
}


/**
 * Validates and resolves management history filters.
 *
 * @param {Object=} filters
 * @return {Object}
 */
function resolveManagementHistoryQuery_(filters) {
  const input = filters && typeof filters === 'object'
    ? filters
    : {};
  const schoolYear = getCurrentJapaneseSchoolYearRange_();
  const requestedScope = String(input.historyScope || '').trim();
  const historyScope = Object.values(HISTORY_SCOPES_).includes(
    requestedScope
  )
    ? requestedScope
    : HISTORY_SCOPES_.CURRENT_SCHOOL_YEAR;
  let fromDateValue = '';
  let toDateValue = '';

  if (historyScope === HISTORY_SCOPES_.CURRENT_SCHOOL_YEAR) {
    fromDateValue = schoolYear.fromDateValue;
    toDateValue = schoolYear.toDateValue;
  } else if (historyScope === HISTORY_SCOPES_.ARCHIVE) {
    toDateValue = addDaysToDateValue_(
      schoolYear.fromDateValue,
      -1
    );
  } else {
    fromDateValue = input.fromDateValue
      ? getDateOnlyValue_(input.fromDateValue)
      : '';
    toDateValue = input.toDateValue
      ? getDateOnlyValue_(input.toDateValue)
      : '';

    if (input.fromDateValue && !fromDateValue) {
      throw new Error('The start date is invalid.');
    }
    if (input.toDateValue && !toDateValue) {
      throw new Error('The end date is invalid.');
    }
    if (!fromDateValue && !toDateValue) {
      throw new Error('Enter a start date or an end date.');
    }
    if (
      fromDateValue &&
      toDateValue &&
      fromDateValue > toDateValue
    ) {
      throw new Error('The start date must not be after the end date.');
    }
  }

  return {
    historyScope: historyScope,
    fromDateValue: fromDateValue,
    toDateValue: toDateValue,
    schoolYear: schoolYear,
    offset: normalizeHistoryOffset_(input.offset),
    limit: CONFIG.MANAGEMENT_HISTORY_PAGE_SIZE
  };
}


/**
 * Applies a resolved date range to a machine-readable date.
 *
 * @param {string} dateValue
 * @param {Object} query
 * @return {boolean}
 */
function isDateInHistoryQuery_(dateValue, query) {
  return Boolean(
    dateValue &&
    (!query.fromDateValue || dateValue >= query.fromDateValue) &&
    (!query.toDateValue || dateValue <= query.toDateValue)
  );
}


/**
 * Returns one explicit page plus discovery metadata.
 *
 * @param {Object[]} records
 * @param {number} offset
 * @param {number} limit
 * @return {Object}
 */
function buildHistoryPage_(records, offset, limit) {
  const safeOffset = normalizeHistoryOffset_(offset);
  const safeLimit = Math.max(1, Number(limit) || 1);
  const items = records.slice(safeOffset, safeOffset + safeLimit);

  return {
    items: items,
    offset: safeOffset,
    nextOffset: safeOffset + items.length,
    hasMore: safeOffset + items.length < records.length,
    total: records.length
  };
}


function normalizeHistoryOffset_(value) {
  const offset = Number(value);

  return Number.isInteger(offset) && offset >= 0
    ? Math.min(offset, 100000)
    : 0;
}
