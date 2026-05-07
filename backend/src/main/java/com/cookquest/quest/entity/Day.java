package com.cookquest.quest.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.DayOfWeek;

@Entity
@Table(name = "days")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Day {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "week_id", nullable = false)
    private Week week;

    @Column(nullable = false)
    private LocalDate date;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DayOfWeek dayOfWeek;

    @JsonIgnore
    @OneToOne(mappedBy = "day", cascade = CascadeType.ALL)
    private Quest quest;
}