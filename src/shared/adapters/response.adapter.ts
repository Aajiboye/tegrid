export const adaptResponse = (data?:any, message?: string) => {
    return {
        message: message || "Operation Successful",
        data 
    }
}