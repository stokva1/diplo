export type LoginResponse = {
    accessToken: string;
    refreshToken: string;
    user: {
        id: string;
        email: string;
        name: string;
    };
    organization: {
        id: string;
        name: string;
        ico?: string | null;
        contactEmail?: string | null;
    };
    member: {
        id: string;
        organizationId: string;
        role: "ADMIN" | "MEMBER";
        status: "ACTIVE" | "DISABLED";
        managedVehicleIds: string[];
    };
};

export type MeResponse = {
    user: {
        id: string;
        email: string;
        name: string;
    };
    organization: {
        id: string;
        name: string;
    };
    member: {
        id: string;
        role: "ADMIN" | "MEMBER";
        status: "ACTIVE" | "DISABLED";
        managedVehicleIds: string[];
    };
};

export type DashboardResponse = {
    upcomingReservations: {
        id: string;
        vehicleName: string;
        licensePlate: string;
        startAt: string;
        endAt: string;
        origin: string;
        destination: string;
        purpose: string;
    }[];
    missingTripLogs: {
        reservationId: string;
        vehicleName: string;
        date: string;
        origin: string;
        destination: string;
    }[];
    recentTrips: {
        tripLogId: string;
        vehicleName: string;
        date: string;
        origin: string;
        destination: string;
        distanceKm: number;
    }[];
};