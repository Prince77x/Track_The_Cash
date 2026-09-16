# Literature Review: Predictive Analytics Framework for Cybercrime Complaints
### Forecasting Likely Cash Withdrawal Locations — SIH 2026 Problem Statement (MHA / I4C)

**Prepared for Hackathon Research | September 2026**

---

## 1. Problem Context & Scale

India's National Cybercrime Reporting Portal (NCRP), operated by the Indian Cyber Crime Coordination Centre (I4C) under MHA, receives approximately **8,000 complaints daily**, with financial losses reported between 2021 and 2024 growing by **41x** — from ₹551 crore to ₹22,848 crore. The number of complaints rose ~623% in the same window, from 2.6 lakh to over 1.9 million annually.

The core challenge: by the time a complaint is registered and police act, **cash has already been withdrawn** from ATMs — often within 10 minutes of the fraud — and recovery becomes nearly impossible. The goal of this problem statement is to **shift from reactive to proactive** law enforcement using predictive ML.

---

## 2. Existing Government Systems (India)

### 2.1 I4C / NCRP Ecosystem

| System | Role | Status |
|---|---|---|
| NCRP (cybercrime.gov.in) | Citizen complaint filing | Live |
| CFCFRMS (1930 helpline) | Fund blocking within minutes of complaint | Live, saved ₹11,158 crore across 32.8 lakh complaints (as of June 2026) |
| National Cybercrime Threat Analytics Unit (TAU) | Pattern intelligence across state police | Operational |
| National Cybercrime Forensic Lab (Dwarka) | Digital forensics support for IOs | Operational |
| Suspect Registry (I4C) | Mule account / suspect data across jurisdictions | Internal / LEA access |

Key statistic: **26.5 lakh layer-1 mule accounts** identified by December 2025 (I4C data). Over **15.75 lakh SIM cards** and **5.77 lakh IMEIs** have been blocked.

> Reference: [I4C Official](https://i4c.mha.gov.in/ncrp.aspx) | [Organiser, Aug 2026](https://organiser.org/2026/08/26/377008/bharat/indias-digital-shield-how-i4c-is-winning-the-war-against-cybercrime/)

---

### 2.2 RBI MuleHunter.AI

Developed by the **Reserve Bank Innovation Hub (RBIH)**, MuleHunter.AI is an ML-based system now deployed across **31 major banks** to detect mule accounts — the backbone of cash-out fraud chains.

- Uses **supervised ensemble learning** (gradient boosting) on transactional and account data
- Performs **cross-institutional data analysis** to identify fraud patterns across banks
- Moves from static rule-based systems (high false positives) to adaptive ML
- Identifies suspicious fan-in/fan-out patterns in banking networks
- Currently being scaled across the entire Indian banking ecosystem

> Reference: [RBIH Docs](https://docs.rbihub.in/mule-hunter) | [Fintech Futures](https://www.fintechfutures.com/ai-in-fintech/reserve-bank-of-india-pilots-new-mulehunter-ai-solution-to-help-identify-mule-accounts) | [RMA India](https://rmaindia.org/mulehunter-ai-rbis-ai-fraud-detection-system-now-live-across-31-banks/)

**Gap identified**: MuleHunter.AI detects mule accounts but **does not predict geographic cash withdrawal locations** — the specific output this problem statement requires.

---

## 3. Authentic Datasets Available

### 3.1 Primary Government Datasets (India)

| Dataset | Source | Access | Contains |
|---|---|---|---|
| NCRB Crime in India 2023 | ncrb.gov.in | Public PDF + OpenCity | State/city-wise cybercrime counts, IT Act + IPC violations |
| NCRB Cybercrime Master Data (2002-2022) | Dataful.in | Public CSV | Year/state/city-wise crime types incl. ATM fraud, OTP fraud, online banking fraud |
| NCRP State-wise Fraud Statistics (Feb 2025) | data.gov.in | Open data | State-UT wise complaint counts and financial losses |
| RBI ATM Deployment (State/Region-wise) | rbi.org.in | Public tables | ATM count by state, region, bank |
| RBI Bankwise ATM/POS/Card Statistics | rbi.org.in/scripts/ATMView.aspx | Public | Bank-wise ATM counts and card stats |
| RBI Credit/Debit Card & Internet Banking Fraud | data.gov.in | Open data | State-wise fraud cases and amounts |

> Dataset Links:
> - [NCRB Master Cybercrime IPC Data](https://dataful.in/datasets/19641/)
> - [NCRB IT Act City-wise Data](https://dataful.in/datasets/19642/)
> - [NCRP State-wise on OGD](https://www.data.gov.in/resource/stateut-wise-details-statistics-national-cyber-crime-reporting-portal-ncrp-related-cyber)
> - [RBI ATM State/Region Deployment](https://www.rbi.org.in/Scripts/StateRegionATMView.aspx)
> - [RBI Bankwise ATM Statistics](https://rbi.org.in/scripts/atmview.aspx)
> - [RBI Fraud Cases on OGD](https://www.data.gov.in/resource/state-wise-rbi-data-credit-card-atmdebit-cards-internet-banking-fraud-cases-amount-100)
> - [Crime in India 2023 — OpenCity](https://data.opencity.in/dataset/crime-in-india-2023)

---

### 3.2 Benchmark / Synthetic Datasets (for ML development)

| Dataset | Source | Description |
|---|---|---|
| PaySim Synthetic Financial Fraud | Kaggle | 6.3M mobile money transactions, CASH-OUT labels, fraud injected |
| IEEE-CIS Fraud Detection (2019) | Kaggle | 590K e-commerce transactions, 394 features, card-level entity tracking |
| Credit Card Fraud (ULB / Worldline) | Kaggle | 284,807 transactions, PCA-transformed, 0.172% fraud rate |
| Indian Financial Fraud Dataset | Kaggle | 250K+ multi-table Indian transactions with fraud labels |
| Inclusive Indian Fraud Dataset | Kaggle | Fraud patterns across India, detailed categories |
| Cybercrime in India Dataset | Kaggle | State/category-wise cybercrime with motive labels |

> Dataset Links:
> - [PaySim](https://www.kaggle.com/datasets/ealaxi/paysim1)
> - [IEEE-CIS Fraud Detection](https://www.kaggle.com/competitions/ieee-fraud-detection)
> - [Indian Financial Fraud Dataset](https://www.kaggle.com/datasets/jatinkhandelwal112/indian-financial-fraud-dataset)
> - [Inclusive Indian Fraud Dataset](https://www.kaggle.com/datasets/kumarperiya/comprehensive-indian-online-fraud-dataset)
> - [Cybercrime in India](https://www.kaggle.com/datasets/seanangelonathanael/dataset-cybercrime-in-india)
> - [AI4FCF Open Datasets Index](https://sites.google.com/view/ai4fcf/open-datasets)

---

## 4. Existing Solutions & Related Work

### 4.1 CashGuard AI (SIH 2026 — same problem, GitHub reference)

A directly comparable open-source solution for this exact problem statement (SIH26184, MHA/I4C).

**Architecture:**
- XGBoost model (Platt-calibrated, 44 features) — predicts P(fraud withdrawal at each ATM in next 24h)
- Synthetic data calibrated from I4C Suspect Registry patterns and IBA mule-account behaviour
- Hawkes process for temporal self-excitation modelling
- Leaflet GIS dashboard with role-based views (Police / Bank / I4C)
- SHA-256 hash-chain audit trail (tamper-evident ledger)
- FastAPI backend with JWT + RBAC

**Reported performance:** ROC-AUC corrected to honest leak-free figure after fixing same-day label leakage in feature engineering.

> Reference: [CashGuard AI — GitHub](https://github.com/stunninghacker/CashGuard-AI)

---

### 4.2 ML Models Used in Crime Hotspot Prediction (Literature)

| Model | Performance | Use Case |
|---|---|---|
| XGBoost | Best performer on Indian city crime data (Springer, 2025) | Property crime hotspot classification |
| LSTM (Spatio-Temporal) | AUC 0.91–0.93, Accuracy 90.5% | Sequential crime hotspot forecasting |
| Random Forest | 86.7% accuracy | Baseline hotspot detection |
| CNN-LSTM hybrid | Strong on grid-based spatial crime | Fine-grained urban crime grids |
| Hawkes Process | Standard for self-exciting crime events (JASA 2011, AAAI 2024) | Point process crime modelling |
| Graph Neural Networks | Best for mule account network detection | Transaction graph fraud |
| ST-Hypergraph (HCL, AAAI 2024) | SOTA for multi-type crime spatial prediction | Urban crime correlations |

Key finding from literature: **XGBoost outperforms** other models on historical crime data; **LSTM-based models outperform** on sequential spatio-temporal data. The combination (ensemble + temporal) is the frontier approach.

> References:
> - [Prediction of Crime Hotspots — Springer 2025](https://link.springer.com/chapter/10.1007/978-981-96-2724-0_40)
> - [Predictive Crime Hotspot Detection — Springer Nature](https://link.springer.com/chapter/10.1007/978-981-97-1946-4_26)
> - [Spatio-Temporal LSTM Hotspot Forecasting — GRENZE 2025](https://thegrenze.com/pages/servej.php?fn=163_25.pdf)
> - [HCL Hawkes-Enhanced ST Hypergraph — AAAI 2024](https://ojs.aaai.org/index.php/AAAI/article/view/28719)
> - [Spatio-Temporal Crime Forecasting with Deep Learning (2025)](https://arxiv.org/pdf/2502.07465)
> - [Event-centric Crime Hotspot Prediction (2024)](https://arxiv.org/pdf/2411.01134)
> - [Likelihood-Free Estimation for Hawkes Processes in Policing](https://arxiv.org/pdf/2502.07111)

---

### 4.3 ATM / Transaction Fraud Detection Patents & Papers

A USPTO patent (US11610205) describes a real-time ATM fraud management system using:
- Historical ATM-level transaction analysis
- Same card rapid withdrawal detection
- Transaction circuit + fraud analysis circuit design

GNN-based approaches (ATM-GAD, arxiv 2025) use **Temporal Motif Extractors** with dual attention (IntraA + InterA) on financial transaction networks.

> References:
> - [Machine Learning-based ATM Fraud Detection (USPTO 11610205)](https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/11610205)
> - [ATM-GAD: Graph Anomaly Detection (arxiv 2025)](https://arxiv.org/pdf/2508.20829)
> - [AI Security Agent for Banking — Multi-Vector Fraud (arxiv 2026)](https://arxiv.org/pdf/2606.17555)

---

## 5. Key Technical Gaps & Research Opportunities

| Gap | Opportunity for This Hackathon |
|---|---|
| No public ATM-level geospatial coordinate dataset | Use RBI state-level ATM data + OpenStreetMap ATM node data as proxy |
| NCRB data is annual, coarse-grained (state/city) | Combine with NCRP complaint velocity (daily counts) for temporal granularity |
| MuleHunter detects mule accounts but not withdrawal location | Extend with ATM proximity clustering to mule account registered addresses |
| No end-to-end complaint → hotspot → LEA alert pipeline exists publicly | This is the core innovation this problem statement calls for |
| Hawkes process not applied to Indian cybercrime complaint data | Direct research contribution — apply self-exciting point process to NCRP data |
| GIS dashboards for Indian cybercrime lack drill-down by crime category | Risk heatmap with NCRB category filters is novel |

---

## 6. Data Strategy Recommendation for Hackathon

Given the unavailability of raw NCRP complaint-level data (restricted to I4C), the recommended approach:

1. **Primary public data**: NCRB annual reports (2019–2023), state/city/category-wise
2. **ATM infrastructure**: RBI state-wise ATM deployment + OpenStreetMap ATM nodes (Overpass API)
3. **Fraud velocity proxy**: I4C annual report statistics + CFCFRMS recovery data
4. **Synthetic complaint generation**: Use PaySim + Indian fraud datasets to simulate complaint streams calibrated to NCRB distributions
5. **Geospatial enrichment**: Census population density, district boundaries (Bhuvan / Survey of India), pin-code-level data

---

## 7. Summary Table of All Reference Links

| Resource | URL |
|---|---|
| I4C Official (NCRP) | https://i4c.mha.gov.in/ncrp.aspx |
| NCRB Crime in India 2022 PDF | https://www.ncrb.gov.in/uploads/nationalcrimerecordsbureau/custom/1701607577CrimeinIndia2022Book1.pdf |
| NCRB Cybercrime IPC Master Data | https://dataful.in/datasets/19641/ |
| NCRB Cybercrime IT Act City Data | https://dataful.in/datasets/19642/ |
| Crime in India 2023 (OpenCity) | https://data.opencity.in/dataset/crime-in-india-2023 |
| NCRP State-wise OGD | https://www.data.gov.in/resource/stateut-wise-details-statistics-national-cyber-crime-reporting-portal-ncrp-related-cyber |
| RBI ATM State Deployment | https://www.rbi.org.in/Scripts/StateRegionATMView.aspx |
| RBI Bankwise ATM Stats | https://rbi.org.in/scripts/atmview.aspx |
| RBI Fraud Cases OGD | https://www.data.gov.in/resource/state-wise-rbi-data-credit-card-atmdebit-cards-internet-banking-fraud-cases-amount-100 |
| RBIH MuleHunter.AI Docs | https://docs.rbihub.in/mule-hunter |
| CashGuard AI (GitHub, same PS) | https://github.com/stunninghacker/CashGuard-AI |
| CyberPeace India Fraud Data Analysis | https://cyberpeace.org/resources/blogs/the-data-behind-indias-digital-fraud-surge |
| I4C Win Stats (Organiser, Aug 2026) | https://organiser.org/2026/08/26/377008/bharat/indias-digital-shield-how-i4c-is-winning-the-war-against-cybercrime/ |
| MuleHunter — 31 Banks Live | https://rmaindia.org/mulehunter-ai-rbis-ai-fraud-detection-system-now-live-across-31-banks/ |
| PaySim Dataset (Kaggle) | https://www.kaggle.com/datasets/ealaxi/paysim1 |
| Indian Financial Fraud Dataset | https://www.kaggle.com/datasets/jatinkhandelwal112/indian-financial-fraud-dataset |
| Inclusive Indian Fraud Dataset | https://www.kaggle.com/datasets/kumarperiya/comprehensive-indian-online-fraud-dataset |
| Cybercrime in India (Kaggle) | https://www.kaggle.com/datasets/seanangelonathanael/dataset-cybercrime-in-india |
| AI4FCF Open Datasets Index | https://sites.google.com/view/ai4fcf/open-datasets |
| Crime Hotspot Prediction — Springer 2025 | https://link.springer.com/chapter/10.1007/978-981-96-2724-0_40 |
| Spatio-Temporal Hotspot Detection — Springer Nature | https://link.springer.com/chapter/10.1007/978-981-97-1946-4_26 |
| LSTM Hotspot Forecasting (GRENZE 2025) | https://thegrenze.com/pages/servej.php?fn=163_25.pdf |
| HCL AAAI 2024 (Hawkes + ST Hypergraph) | https://ojs.aaai.org/index.php/AAAI/article/view/28719 |
| ST Crime Forecasting Deep Learning | https://arxiv.org/pdf/2502.07465 |
| Event-centric Crime Hotspot Prediction | https://arxiv.org/pdf/2411.01134 |
| Hawkes Process Policing | https://arxiv.org/pdf/2502.07111 |
| ATM Fraud Detection Patent (USPTO) | https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/11610205 |
| ATM-GAD Graph Anomaly Detection | https://arxiv.org/pdf/2508.20829 |
| Multi-Vector Banking Fraud AI | https://arxiv.org/pdf/2606.17555 |
| Innefu Labs Crime Hotspot Overview | https://innefu.com/crime-prediction-using-machine-learning-from-crime-pattern-analysis-to-hotspot-mapping/ |
| RBIH EDD TechSprint (RBIH Sandbox) | https://ministryofcyberaffairs.com/news/inside-rbih-s-edd-techsprint-india-adopting-ai-to-solve-its-mule-accounts-issue-bdbf163b-7376-41cd-9dc9-db65f1dc1d05 |
| IMF ATM Density India (FRED) | https://fred.stlouisfed.org/series/INDFCAKNUM |

---

*Report compiled: September 2026 | Sources: MHA, RBI, NCRB, I4C, RBIH, Kaggle, Springer, AAAI, arXiv*
