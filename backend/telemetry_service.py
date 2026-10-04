import random
from datetime import datetime, timezone
from typing import Any


class MineTelemetryManager:
    def __init__(self):
        self.zones = {
            "ZONE-1": {
                "id": "ZONE-1",
                "name": "District 1: Main Incline & Shaft Bottom",
                "type": "Haulage & Intake",
                "ch4": 0.08,  # Percentage
                "co": 3.2,  # ppm
                "o2": 20.8,  # Percentage
                "airflow": 2.4,  # m/s
                "temp": 24.5,  # Celsius
                "strata_disp": 0.4,  # mm
                "power_status": "NORMAL",
                "last_spike": None,
            },
            "ZONE-2": {
                "id": "ZONE-2",
                "name": "District 2: Longwall Face 4 (Active Cutting)",
                "type": "Active Face",
                "ch4": 0.42,
                "co": 8.5,
                "o2": 20.4,
                "airflow": 0.95,
                "temp": 28.2,
                "strata_disp": 1.8,
                "power_status": "NORMAL",
                "last_spike": None,
            },
            "ZONE-3": {
                "id": "ZONE-3",
                "name": "District 3: Return Airway 3-West",
                "type": "Return Airway",
                "ch4": 0.65,
                "co": 12.0,
                "o2": 19.9,
                "airflow": 1.15,
                "temp": 29.8,
                "strata_disp": 2.2,
                "power_status": "NORMAL",
                "last_spike": None,
            },
            "ZONE-4": {
                "id": "ZONE-4",
                "name": "District 4: Depillaring Sector & Goaf Perimeter",
                "type": "Goaf Perimeter",
                "ch4": 0.35,
                "co": 6.8,
                "o2": 20.2,
                "airflow": 0.85,
                "temp": 27.1,
                "strata_disp": 3.4,
                "power_status": "NORMAL",
                "last_spike": None,
            },
        }
        self.alert_history: list[dict[str, Any]] = []

    def get_live_readings(self) -> dict[str, Any]:
        """
        Simulates realistic micro-fluctuations in sensor readings
        and evaluates DGMS statutory safety thresholds.
        """
        current_time = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
        output_zones = []
        overall_mine_status = "NORMAL"

        for zone_id, data in self.zones.items():
            # Apply slight realistic brownian noise
            if not data.get("is_spiked"):
                data["ch4"] = max(
                    0.02, round(data["ch4"] + random.uniform(-0.02, 0.02), 3)
                )
                data["co"] = max(1.0, round(data["co"] + random.uniform(-0.5, 0.5), 1))
                data["o2"] = max(
                    18.0, min(21.0, round(data["o2"] + random.uniform(-0.05, 0.05), 2))
                )
                data["airflow"] = max(
                    0.2, round(data["airflow"] + random.uniform(-0.03, 0.03), 2)
                )
                data["temp"] = round(data["temp"] + random.uniform(-0.1, 0.1), 1)
                data["strata_disp"] = round(
                    data["strata_disp"] + random.uniform(0.0, 0.02), 2
                )
            else:
                # Decay spike gradually back to baseline
                data["ch4"] = round(data["ch4"] * 0.92, 3)
                data["co"] = round(data["co"] * 0.92, 1)
                data["strata_disp"] = round(data["strata_disp"] * 0.98, 2)
                if (
                    data["ch4"] <= 0.6
                    and data["co"] <= 15.0
                    and data["strata_disp"] <= 4.0
                ):
                    data["is_spiked"] = False
                    data["power_status"] = "NORMAL"

            # Threshold analysis per CMR 2017 Regulations 153, 154, 123
            alerts = []
            status = "NORMAL"

            # Methane Thresholds
            if data["ch4"] >= 1.25:
                status = "CRITICAL"
                alerts.append(
                    "CRITICAL: Methane >= 1.25%. CMR 2017 Reg 154 mandates immediate power cut-off & evacuation."
                )
                data["power_status"] = "TRIPPED_AUTOMATICALLY"
            elif data["ch4"] >= 0.75:
                status = "HIGH" if status != "CRITICAL" else status
                alerts.append(
                    "HIGH ALERT: CH4 exceeds 0.75% return airway limit. Adjust ventilation regulator."
                )
            elif data["ch4"] >= 0.50:
                status = "WARNING" if status == "NORMAL" else status
                alerts.append("WARNING: CH4 exceeds 0.50% general body threshold.")

            # Carbon Monoxide Thresholds
            if data["co"] >= 50.0:
                status = "CRITICAL"
                alerts.append(
                    "CRITICAL: CO >= 50 ppm indicates active spontaneous combustion / fire."
                )
            elif data["co"] >= 20.0:
                status = "HIGH" if status != "CRITICAL" else status
                alerts.append(
                    "HIGH ALERT: Elevated CO indicates potential goaf heating."
                )

            # Oxygen Threshold
            if data["o2"] < 19.0:
                status = "CRITICAL"
                alerts.append(
                    "CRITICAL: O2 below statutory minimum 19.0% (CMR Reg 153)."
                )

            # Strata Roof Displacement
            if data["strata_disp"] >= 5.0:
                status = "CRITICAL"
                alerts.append(
                    "CRITICAL: Strata bed separation > 5.0mm. Imminent roof collapse danger."
                )
            elif data["strata_disp"] >= 3.0:
                status = "WARNING" if status == "NORMAL" else status
                alerts.append(
                    "WARNING: Accelerated strata displacement. Supplementary bolting required."
                )

            if status in ["CRITICAL", "HIGH"]:
                overall_mine_status = (
                    "CRITICAL"
                    if status == "CRITICAL"
                    else (
                        "HIGH"
                        if overall_mine_status != "CRITICAL"
                        else overall_mine_status
                    )
                )
                # Record to history if new
                if not any(
                    a["zone"] == zone_id and a["message"] == alerts[0]
                    for a in self.alert_history[-5:]
                ):
                    self.alert_history.append(
                        {
                            "timestamp": current_time,
                            "zone": zone_id,
                            "zone_name": data["name"],
                            "severity": status,
                            "message": alerts[0],
                        }
                    )

            output_zones.append({**data, "status": status, "active_alerts": alerts})

        return {
            "timestamp": current_time,
            "overall_status": overall_mine_status,
            "zones": output_zones,
            "recent_alerts": self.alert_history[-10:],
        }

    def simulate_anomaly(
        self, zone_id: str, hazard_type: str = "ch4_spike"
    ) -> dict[str, Any]:
        """
        Simulates an emergency scenario for testing Agentic AI response.
        """
        if zone_id not in self.zones:
            zone_id = "ZONE-2"

        target = self.zones[zone_id]
        target["is_spiked"] = True
        target["last_spike"] = datetime.now(timezone.utc).strftime("%H:%M:%S")

        if hazard_type == "ch4_spike":
            target["ch4"] = 1.48
            target["airflow"] = 0.35
            msg = f"Simulated dangerous Methane surge (1.48%) and ventilation drop in {target['name']}."
        elif hazard_type == "fire_co":
            target["co"] = 68.0
            target["temp"] = 38.5
            msg = f"Simulated Goaf fire condition (CO: 68 ppm, Temp: 38.5°C) in {target['name']}."
        elif hazard_type == "strata_collapse":
            target["strata_disp"] = 6.8
            msg = f"Simulated rapid roof bed separation (6.8mm) in {target['name']}."
        else:
            target["ch4"] = 1.35
            msg = f"Simulated combined hazard in {target['name']}."

        return {
            "success": True,
            "message": msg,
            "zone_id": zone_id,
            "affected_zone": target["name"],
            "hazard_type": hazard_type,
        }


telemetry_manager = MineTelemetryManager()
