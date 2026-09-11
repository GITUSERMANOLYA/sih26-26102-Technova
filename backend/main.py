from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
import pandas as pd
import numpy as np


app = FastAPI(
    title="SIH Works Risk Detection API",
    description="Backend API for government works risk analysis",
    version="1.0.0"
)


# --------------------------------------------------
# CORS
# --------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --------------------------------------------------
# LOAD ML OUTPUT
# --------------------------------------------------

BASE_DIR = Path(__file__).resolve().parent
DATA_FILE = BASE_DIR / "scored_works.csv"

if not DATA_FILE.exists():
    raise FileNotFoundError(
        f"scored_works.csv not found at: {DATA_FILE}"
    )

df = pd.read_csv(DATA_FILE)


# --------------------------------------------------
# HELPERS
# --------------------------------------------------

def clean_value(value):
    """
    Convert pandas/numpy values into JSON-safe values.
    """

    if pd.isna(value):
        return None

    if isinstance(value, (np.integer,)):
        return int(value)

    if isinstance(value, (np.floating,)):
        return float(value)

    return value


def get_first_value(record, possible_columns):
    """
    Return the first usable value from a list of possible
    column names.
    """

    for column in possible_columns:

        if column in record:

            value = record[column]

            if value is not None:
                try:
                    if pd.isna(value):
                        continue
                except Exception:
                    pass

            if str(value).strip() != "":
                return value

    return None


def determine_lifecycle_stage(record):

    # Get status group
    status_group = get_first_value(
        record,
        [
            "status_group",
            "Status Group",
            "Status_Group"
        ]
    )

    status_group = str(
        status_group if status_group is not None else ""
    ).strip().lower()


    # Get work status
    work_status = get_first_value(
        record,
        [
            "san_work_status",
            "San Work Status",
            "San_Work_Status"
        ]
    )

    work_status = str(
        work_status if work_status is not None else ""
    ).strip().lower()


    # Get completion date
    completion_date = get_first_value(
        record,
        [
            "comp_completion_date",
            "Comp Completion Date",
            "Comp_Completion_Date",
            "Comp_Completion Date",
            "completion_date",
            "Completion Date"
        ]
    )


    # Get sanction date
    sanction_date = get_first_value(
        record,
        [
            "san_sanction_date",
            "Sanction Date",
            "San_Sanction_Date",
            "San_Sanction Date"
        ]
    )


    # Get recommendation date
    recommendation_date = get_first_value(
        record,
        [
            "rec_recommended_date",
            "Recommended Date",
            "Rec Recommended Date",
            "Rec_Recommended_Date",
            "Rec_Recommended date"
        ]
    )


    # ==========================================
    # 1. COMPLETED
    # ==========================================

    if "completed" in status_group:
        return "Completed"

    if "completed" in work_status:
        return "Completed"

    if completion_date is not None:
        return "Completed"


    # ==========================================
    # 2. SANCTIONED
    # ==========================================

    if "progress" in status_group:
        return "Sanctioned"

    if "ongoing" in status_group:
        return "Sanctioned"

    if "sanction" in status_group:
        return "Sanctioned"

    if "progress" in work_status:
        return "Sanctioned"

    if "ongoing" in work_status:
        return "Sanctioned"

    if "sanction" in work_status:
        return "Sanctioned"

    if sanction_date is not None:
        return "Sanctioned"


    # ==========================================
    # 3. RECOMMENDED
    # ==========================================

    if recommendation_date is not None:
        return "Recommended"


    # ==========================================
    # 4. FALLBACK
    # ==========================================

    return "Recommended"


def clean_records(dataframe):
    """
    Convert dataframe records into JSON-safe dictionaries
    and add the correct lifecycle_stage.
    """

    records = dataframe.to_dict(orient="records")

    cleaned = []

    for record in records:

        # Determine lifecycle from actual backend data
        record["lifecycle_stage"] = determine_lifecycle_stage(
            record
        )

        cleaned.append({
            key: clean_value(value)
            for key, value in record.items()
        })

    return cleaned


# --------------------------------------------------
# ROOT
# --------------------------------------------------

@app.get("/")
def root():

    return {
        "message": "SIH Works Risk Detection API is running",
        "total_records": len(df)
    }


# --------------------------------------------------
# HEALTH CHECK
# --------------------------------------------------

@app.get("/health")
def health():

    return {
        "status": "healthy",
        "records_loaded": len(df)
    }


# --------------------------------------------------
# DASHBOARD SUMMARY
# --------------------------------------------------

@app.get("/dashboard")
def dashboard():

    total = len(df)

    high = 0
    medium = 0
    low = 0


    # ----------------------------------------------
    # RISK COUNTS
    # ----------------------------------------------

    if "risk_tier" in df.columns:

        risk_counts = (
            df["risk_tier"]
            .astype(str)
            .str.lower()
            .value_counts()
        )

        high = int(
            risk_counts.get("high", 0)
        )

        medium = int(
            risk_counts.get("medium", 0)
        )

        low = int(
            risk_counts.get("low", 0)
        )


    # ----------------------------------------------
    # STATUS COUNTS
    # ----------------------------------------------

    completed = 0
    in_progress = 0

    if "status_group" in df.columns:

        status = (
            df["status_group"]
            .astype(str)
            .str.lower()
        )

        completed = int(
            status.str.contains(
                "completed",
                na=False
            ).sum()
        )

        in_progress = int(
            status.str.contains(
                "progress",
                na=False
            ).sum()
        )


    return {
        "total_works": total,
        "high_risk": high,
        "medium_risk": medium,
        "low_risk": low,
        "completed": completed,
        "in_progress": in_progress
    }


# --------------------------------------------------
# RISK DISTRIBUTION
# --------------------------------------------------

@app.get("/risk-distribution")
def risk_distribution():

    if "risk_tier" not in df.columns:
        return {}

    result = (
        df["risk_tier"]
        .astype(str)
        .str.lower()
        .value_counts()
        .to_dict()
    )

    return {
        str(key): int(value)
        for key, value in result.items()
    }


# --------------------------------------------------
# GET WORKS
# --------------------------------------------------

@app.get("/works")
def get_works(
    risk: str | None = None,
    state: str | None = None,
    status: str | None = None,
    search: str | None = None,
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=500)
):

    result = df.copy()


    # ----------------------------------------------
    # RISK FILTER
    # ----------------------------------------------

    if risk and "risk_tier" in result.columns:

        result = result[
            result["risk_tier"]
            .astype(str)
            .str.lower()
            == risk.lower()
        ]


    # ----------------------------------------------
    # STATE FILTER
    # ----------------------------------------------

    if state and "State" in result.columns:

        result = result[
            result["State"]
            .astype(str)
            .str.lower()
            == state.lower()
        ]


    # ----------------------------------------------
    # STATUS FILTER
    # ----------------------------------------------

    if status and "status_group" in result.columns:

        result = result[
            result["status_group"]
            .astype(str)
            .str.lower()
            .str.contains(
                status.lower(),
                na=False
            )
        ]


    # ----------------------------------------------
    # SEARCH
    # ----------------------------------------------

    if search:

        search_lower = search.lower()

        mask = result.astype(str).apply(
            lambda column:
                column.str.lower().str.contains(
                    search_lower,
                    na=False
                )
        ).any(axis=1)

        result = result[mask]


    # ----------------------------------------------
    # TOTAL
    # ----------------------------------------------

    total = len(result)


    # ----------------------------------------------
    # PAGINATION
    # ----------------------------------------------

    start = (page - 1) * limit
    end = start + limit

    result = result.iloc[start:end]


    # ----------------------------------------------
    # RESPONSE
    # ----------------------------------------------

    return {
        "total": total,
        "page": page,
        "limit": limit,
        "data": clean_records(result)
    }


# --------------------------------------------------
# GET SINGLE WORK
# --------------------------------------------------

@app.get("/works/{work_id:path}")
def get_work(work_id: str):

    possible_columns = [
        "Work ID",
        "Work_ID",
        "work_id",
        "id",
        "ID"
    ]

    column = None

    for candidate in possible_columns:

        if candidate in df.columns:
            column = candidate
            break


    if column is None:

        raise HTTPException(
            status_code=500,
            detail="No work ID column found in dataset"
        )


    result = df[
        df[column].astype(str)
        == str(work_id)
    ]


    if result.empty:

        raise HTTPException(
            status_code=404,
            detail="Work not found"
        )


    return clean_records(result)[0]


# --------------------------------------------------
# HIGH-RISK WORKS
# --------------------------------------------------

@app.get("/high-risk")
def high_risk(
    limit: int = Query(
        100,
        ge=1,
        le=500
    )
):

    if "risk_tier" not in df.columns:

        return {
            "total": 0,
            "data": []
        }


    result = df[
        df["risk_tier"]
        .astype(str)
        .str.lower()
        == "high"
    ]


    return {
        "total": len(result),
        "data": clean_records(
            result.head(limit)
        )
    }


# --------------------------------------------------
# STATES
# --------------------------------------------------

@app.get("/states")
def states():

    if "State" not in df.columns:
        return []


    values = (
        df["State"]
        .dropna()
        .astype(str)
        .unique()
        .tolist()
    )


    return sorted(values)


# --------------------------------------------------
# CATEGORIES
# --------------------------------------------------

@app.get("/categories")
def categories():

    possible_columns = [
        "Work Category",
        "Work_Category",
        "Category",
        "category"
    ]


    for column in possible_columns:

        if column in df.columns:

            values = (
                df[column]
                .dropna()
                .astype(str)
                .unique()
                .tolist()
            )

            return sorted(values)


    return []


# --------------------------------------------------
# STATE SUMMARY
# --------------------------------------------------

@app.get("/state-summary")
def state_summary():

    if "State" not in df.columns:
        return []


    grouped = (
        df.groupby("State")
        .size()
        .reset_index(
            name="total_works"
        )
    )


    return clean_records(grouped)


# --------------------------------------------------
# RUN
# --------------------------------------------------

if __name__ == "__main__":

    import uvicorn

    uvicorn.run(
        "main:app",
        host="127.0.0.1",
        port=8000,
        reload=True
    )