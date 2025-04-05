
export const getStatusColor = (status: string) => {
  switch (status) {
    case "draft":
      return "bg-gray-100 text-gray-800";
    case "pending":
      return "bg-yellow-100 text-yellow-800";
    case "confirmed":
      return "bg-blue-100 text-blue-800";
    case "delivered":
      return "bg-green-100 text-green-800";
    case "canceled":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export const getPaymentStatusColor = (status: string) => {
  switch (status) {
    case "unpaid":
      return "bg-red-100 text-red-800";
    case "partial":
      return "bg-yellow-100 text-yellow-800";
    case "paid":
      return "bg-green-100 text-green-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};
