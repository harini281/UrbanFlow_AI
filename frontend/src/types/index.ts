export type Summary={total_outgoing_trips_top_zones:number;total_incoming_trips_top_zones:number;top_pickup_zone:string;top_dropoff_zone:string;top_od_flow:{origin:string;destination:string;trips:number};forecast_72h_total:number;forecast_peak_zone:string;average_model_test_r2:number;quality_issues:number;models_available:number};
export type Hotspot={origin_loc_id:number;origin_zone:string;outgoing_trip_count:number};
export type Flow={origin_loc_id:number;dest_loc_id:number;trip_count:number;origin_zone:string;destination_zone:string};
export type Forecast={timestamp:string;zone_id:number;predicted_demand:number;borough_name:string;zone_name:string;service_zone:string};
