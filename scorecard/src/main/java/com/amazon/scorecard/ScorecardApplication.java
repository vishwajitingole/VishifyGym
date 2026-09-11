package com.amazon.scorecard;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;

@SpringBootApplication
@ComponentScan("com.amazon.scorecard")
public class ScorecardApplication {

	public static void main(String[] args) {
		SpringApplication.run(ScorecardApplication.class, args);
	}

}
