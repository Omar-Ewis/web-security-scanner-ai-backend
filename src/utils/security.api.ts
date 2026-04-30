export const ZAP_APIS = {
  SPIDER: `${process.env.ZAP_BASE_URL}${process.env.ZAP_RUN_SPIDER_ENDPOINT}`,
  AJAX: `${process.env.ZAP_BASE_URL}${process.env.ZAP_RUN_AJAX_SPIDER_ENDPOINT}`,
  ACTIVE: `${process.env.ZAP_BASE_URL}${process.env.ZAP_RUN_ACTIVE_SCAN_ENDPOINT}`,
  
  STATUS: (scanId: number | string) =>
    `${process.env.ZAP_BASE_URL}${process.env.ZAP_ASCAN_STATUS_ENDPOINT}/${scanId}/status`,
  
  RESULTS: (scanId: number | string) =>
    `${process.env.ZAP_BASE_URL}${process.env.ZAP_ASCAN_RESULTS_ENDPOINT}/${scanId}/results`,
  
  STOP: (scanId: number | string) =>
    `${process.env.ZAP_BASE_URL}${process.env.ZAP_ASCAN_STOP_ENDPOINT}/${scanId}/stop`,
};