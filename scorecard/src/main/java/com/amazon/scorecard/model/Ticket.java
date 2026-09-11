package com.amazon.scorecard.model;

public class Ticket {
    private int id;
    private String title;
    private String description;
    private String status;
    private String priority;

    public Ticket() {

    }

    @Override
    public String toString() {
        return " " + title + " " + description + " " + status + " " + priority + " ";
    }

    public Ticket(String title, String description, String status, String priority, int id) {
        this.title = title;
        this.description = description;
        this.status = status;
        this.priority = priority;
        this.id = id;
    }

    /**
     * @return String return the title
     */
    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    /**
     * @return String return the description
     */
    public String getDescription() {
        return description;
    }

    /**
     * @param description the description to set
     */
    public void setDescription(String description) {
        this.description = description;
    }

    /**
     * @return String return the status
     */
    public String getStatus() {
        return status;
    }

    /**
     * @param status the status to set
     */
    public void setStatus(String status) {
        this.status = status;
    }

    /**
     * @return String return the priority
     */
    public String getPriority() {
        return priority;
    }

    /**
     * @param priority the priority to set
     */
    public void setPriority(String priority) {
        this.priority = priority;
    }

    /**
     * @return int return the id
     */
    public int getId() {
        return id;
    }

    /**
     * @param id the id to set
     */
    public void setId(int id) {
        this.id = id;
    }

}
