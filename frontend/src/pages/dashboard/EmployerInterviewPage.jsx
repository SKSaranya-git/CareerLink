import { useEffect, useMemo, useState } from "react";
import api from "../../api/axios";

const TAB_KEYS = ["upcoming", "pending", "action-needed", "past"];
const PAGE_SIZE = 6;

function tabLabel(key) {
	if (key === "action-needed") return "Action needed";
	return key.charAt(0).toUpperCase() + key.slice(1);
}

function classifyInterview(interview, now) {
	const startsAt = new Date(interview.startsAt);
	const isPast = Number.isNaN(startsAt.getTime()) || startsAt < now;
	const isCancelled = interview.status === "cancelled";
	const hasLocation = Boolean((interview.location || "").trim() || (interview.meetingLink || "").trim());
	const hoursUntil = (startsAt.getTime() - now.getTime()) / (1000 * 60 * 60);

	if (isCancelled) return "action-needed";
	if (isPast) return "past";
	if (!hasLocation) return "action-needed";
	if (hoursUntil <= 48) return "pending";
	return "upcoming";
}

function formatDateTime(value) {
	const d = new Date(value);
	if (Number.isNaN(d.getTime())) return "-";
	return d.toLocaleString([], {
		year: "numeric",
		month: "short",
		day: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
}

function rangeWindow(rangeKey) {
	const startOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
	const addDays = (date, days) => {
		const next = new Date(date);
		next.setDate(next.getDate() + days);
		return next;
	};

	const now = new Date();
	if (rangeKey === "today") {
		const start = startOfDay(now);
		return { start, end: addDays(start, 1) };
	}
	if (rangeKey === "tomorrow") {
		const start = startOfDay(addDays(now, 1));
		return { start, end: addDays(start, 1) };
	}
	if (rangeKey === "all") return null;
	const days = Number(rangeKey);
	if (!Number.isFinite(days)) return null;
	const start = new Date(now);
	start.setDate(now.getDate() - days);
	return { start };
}

export default function EmployerInterviewPage() {
	const [interviews, setInterviews] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [message, setMessage] = useState("");
	const [activeTab, setActiveTab] = useState("upcoming");
	const [rangeFilter, setRangeFilter] = useState("14");
	const [accountFilter, setAccountFilter] = useState("mine");
	const [page, setPage] = useState(1);
	const [selectedInterview, setSelectedInterview] = useState(null);
	const [saving, setSaving] = useState(false);

	const loadInterviews = async () => {
		setLoading(true);
		setError("");
		try {
			const { data } = await api.get("/interviews");
			setInterviews(data.interviews || []);
		} catch (err) {
			setError(err.response?.data?.message || "Failed to load interviews.");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		loadInterviews();
	}, []);

	const filteredInterviews = useMemo(() => {
		const sorted = [...interviews].sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt));
		const window = rangeWindow(rangeFilter);

		if (!window) return sorted;

		return sorted.filter((item) => {
			const d = new Date(item.startsAt);
			if (Number.isNaN(d.getTime())) return false;
			return d >= window.start && (!window.end || d < window.end);
		});
	}, [interviews, rangeFilter]);

	const interviewsByTab = useMemo(() => {
		const now = new Date();
		const grouped = {
			upcoming: [],
			pending: [],
			"action-needed": [],
			past: [],
		};

		filteredInterviews.forEach((item) => {
			const key = classifyInterview(item, now);
			grouped[key].push(item);
		});

		return grouped;
	}, [filteredInterviews]);

	const activeList = interviewsByTab[activeTab] || [];

	const totalPages = Math.max(1, Math.ceil(activeList.length / PAGE_SIZE));

	const paginatedList = useMemo(() => {
		const start = (page - 1) * PAGE_SIZE;
		return activeList.slice(start, start + PAGE_SIZE);
	}, [activeList, page]);

	useEffect(() => {
		setPage(1);
	}, [activeTab, rangeFilter, accountFilter]);

	useEffect(() => {
		if (page > totalPages) setPage(totalPages);
	}, [page, totalPages]);

	const updateStatus = async (interviewId, status) => {
		setSaving(true);
		setError("");
		setMessage("");
		try {
			const { data } = await api.patch(`/interviews/${interviewId}`, { status });
			setMessage(data.message || "Interview updated.");
			await loadInterviews();
			setSelectedInterview((prev) => {
				if (!prev || prev._id !== interviewId) return prev;
				return { ...prev, status };
			});
		} catch (err) {
			setError(err.response?.data?.message || "Failed to update interview.");
		} finally {
			setSaving(false);
		}
	};

	const deleteInterview = async (interviewId) => {
		const ok = window.confirm("Delete this interview schedule? This action cannot be undone.");
		if (!ok) return;

		setSaving(true);
		setError("");
		setMessage("");
		try {
			const { data } = await api.delete(`/interviews/${interviewId}`);
			setMessage(data.message || "Interview deleted.");
			setSelectedInterview(null);
			await loadInterviews();
		} catch (err) {
			setError(err.response?.data?.message || "Failed to delete interview.");
		} finally {
			setSaving(false);
		}
	};

	const downloadIcs = async (interviewId) => {
		try {
			const response = await api.get(`/interviews/${interviewId}/ics`, {
				responseType: "blob",
			});
			const blob = new Blob([response.data], { type: "text/calendar;charset=utf-8" });
			const url = window.URL.createObjectURL(blob);
			const link = document.createElement("a");
			link.href = url;
			link.download = `interview-${interviewId}.ics`;
			document.body.appendChild(link);
			link.click();
			link.remove();
			window.URL.revokeObjectURL(url);
		} catch (err) {
			setError(err.response?.data?.message || "Failed to download invite.");
		}
	};

	const tabCounts = {
		upcoming: interviewsByTab.upcoming.length,
		pending: interviewsByTab.pending.length,
		"action-needed": interviewsByTab["action-needed"].length,
		past: interviewsByTab.past.length,
	};

	return (
		<div className="employer-interview-page">
			<div className="employer-interview-controls">
				<label className="employer-interview-select-wrap" htmlFor="account-filter">
					<select
						id="account-filter"
						value={accountFilter}
						onChange={(e) => setAccountFilter(e.target.value)}
						className="employer-interview-select"
					>
						<option value="mine">Your account</option>
					</select>
					<span className="employer-interview-select-caret">v</span>
				</label>

				<label className="employer-interview-select-wrap" htmlFor="range-filter">
					<select
						id="range-filter"
						value={rangeFilter}
						onChange={(e) => setRangeFilter(e.target.value)}
						className="employer-interview-select"
					>
						<option value="today">Today</option>
						<option value="tomorrow">Tomorrow</option>
						<option value="14">Last 14 days</option>
						<option value="30">Last 30 days</option>
						<option value="90">Last 90 days</option>
						<option value="all">All time</option>
					</select>
					<span className="employer-interview-select-caret">v</span>
				</label>
			</div>

			{message ? <p>{message}</p> : null}
			{error ? <p className="error">{error}</p> : null}

			<section className="dash-panel employer-interview-panel">
				<div className="employer-interview-tabs" role="tablist" aria-label="Interview status tabs">
					{TAB_KEYS.map((key) => (
						<button
							key={key}
							type="button"
							role="tab"
							aria-selected={activeTab === key}
							className={`employer-interview-tab ${activeTab === key ? "active" : ""}`}
							onClick={() => setActiveTab(key)}
						>
							{tabLabel(key)} {tabCounts[key]}
						</button>
					))}
				</div>

				<div className="employer-interview-content">
					{loading ? (
						<p className="dash-muted">Loading interviews...</p>
					) : paginatedList.length === 0 ? (
						<p className="dash-muted">No interviews in this section.</p>
					) : (
						<div className="employer-interview-list">
							{paginatedList.map((item) => (
								<article className="employer-interview-item" key={item._id}>
									<div>
										<p className="employer-interview-item-title">{item.job?.title || "Interview"}</p>
										<p className="dash-muted">
											{item.applicant?.name || "Candidate"} - {formatDateTime(item.startsAt)}
										</p>
										<p className="dash-muted">
											{item.location || item.meetingLink || "Location/meeting link not set"}
										</p>
									</div>
									<div className="employer-interview-item-actions">
										<button
											className="btn secondary-btn small-btn"
											type="button"
											onClick={() => setSelectedInterview(item)}
										>
											Manage
										</button>
										<button
											className="btn secondary-btn small-btn"
											type="button"
											onClick={() => downloadIcs(item._id)}
										>
											ICS
										</button>
									</div>
								</article>
							))}
						</div>
					)}
				</div>

				<div className="employer-interview-pagination">
					<button
						type="button"
						className="btn secondary-btn"
						onClick={() => setPage((prev) => Math.max(1, prev - 1))}
						disabled={page <= 1}
					>
						Prev
					</button>
					<span className="dash-muted">
						Page {page} of {totalPages}
					</span>
					<button
						type="button"
						className="btn secondary-btn"
						onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
						disabled={page >= totalPages}
					>
						Next
					</button>
				</div>
			</section>

			{selectedInterview ? (
				<div className="dialog-backdrop" role="presentation" onClick={() => setSelectedInterview(null)}>
					<div className="dialog" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
						<div className="dialog-head">
							<h3>Manage Interview</h3>
							<button
								type="button"
								className="dialog-close"
								onClick={() => setSelectedInterview(null)}
								aria-label="Close dialog"
							>
								x
							</button>
						</div>

						<div className="dialog-body">
							<p>
								<strong>Job:</strong> {selectedInterview.job?.title || "-"}
							</p>
							<p>
								<strong>Candidate:</strong> {selectedInterview.applicant?.name || "-"}
							</p>
							<p>
								<strong>Start:</strong> {formatDateTime(selectedInterview.startsAt)}
							</p>
							<p>
								<strong>End:</strong> {formatDateTime(selectedInterview.endsAt)}
							</p>
							<p>
								<strong>Status:</strong> {selectedInterview.status || "scheduled"}
							</p>
							<p>
								<strong>Meeting:</strong> {selectedInterview.meetingLink || selectedInterview.location || "Not set"}
							</p>
						</div>

						<div className="dialog-actions employer-interview-modal-actions">
							{activeTab === "action-needed" ? (
								<button
									type="button"
									className="btn danger"
									onClick={() => deleteInterview(selectedInterview._id)}
									disabled={saving}
								>
									{saving ? "Deleting..." : "Delete"}
								</button>
							) : null}
							{selectedInterview.status === "cancelled" ? (
								<button
									type="button"
									className="btn"
									onClick={() => updateStatus(selectedInterview._id, "scheduled")}
									disabled={saving}
								>
									{saving ? "Saving..." : "Mark as Scheduled"}
								</button>
							) : (
								<button
									type="button"
									className="btn danger"
									onClick={() => updateStatus(selectedInterview._id, "cancelled")}
									disabled={saving}
								>
									{saving ? "Saving..." : "Cancel Interview"}
								</button>
							)}
							<button
								type="button"
								className="btn secondary-btn"
								onClick={() => downloadIcs(selectedInterview._id)}
							>
								Download ICS
							</button>
						</div>
					</div>
				</div>
			) : null}
		</div>
	);
}
