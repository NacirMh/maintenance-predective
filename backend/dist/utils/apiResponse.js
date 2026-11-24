export function ok(res, data, status = 200) {
    return res.status(status).json({ success: true, data });
}
export function paginated(res, data, meta) {
    return res.status(200).json({
        success: true,
        data,
        meta: {
            ...meta,
            pages: Math.max(1, Math.ceil(meta.total / meta.limit)),
        },
    });
}
//# sourceMappingURL=apiResponse.js.map